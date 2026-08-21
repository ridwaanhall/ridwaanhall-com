import "server-only";

import { and, asc, desc, eq, gte, ilike, or, sql, type SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

import { pageRange } from "@/lib/api/pagination";
import { db } from "@/lib/db/client";

/**
 * One generic changelist, driven by a per-model descriptor.
 *
 * Django built this from `list_display`, `list_filter`, `search_fields` and
 * `ordering` on each `ModelAdmin`; the descriptors under `lib/admin/models/`
 * carry the same four things, and everything below turns them into one SQL
 * query. Sorting, filtering, searching and paging all happen in Postgres --
 * not over a fetched array -- because several of these tables outgrow a page
 * (101 skills, 64 projects, 62 applications), and a list that silently sorts
 * only the rows it already has is worse than one that does not sort at all.
 *
 * **Foreign keys are displayed with a scalar subquery, not a join.** Django
 * needed `list_select_related` to stop the changelist issuing a query per row;
 * a correlated subquery is likewise one query, and it keeps a single table in
 * `FROM`, so filtering, ordering, counting and paging compose without join
 * plumbing that the row query and the count query would both have to repeat.
 * The targets are small by construction -- 19 organizations, 37 user profiles,
 * 2 legal documents -- and every one is looked up by primary key.
 */

/** How a cell is rendered. Descriptors stay data; the table decides looks. */
export type ColumnKind =
  | "text"
  | "muted"
  | "code"
  | "bool"
  | "number"
  | "date"
  | "datetime";

export type ListColumn<Row> = {
  /** Identity, and the value `?sort=` carries. */
  key: string;
  label: string;
  kind?: ColumnKind;
  /**
   * What to ORDER BY. Omitted means the column is computed in TypeScript --
   * Django's `used_by`, `short_body` and `target_label` were the same, and its
   * changelist likewise refused to sort on them.
   */
  sort?: SQL | PgColumn;
  /** The cell's value. Primitives only, so a descriptor needs no JSX. */
  value: (row: Row) => string | number | boolean | null;
};

export type FilterChoice = { value: string; label: string };

/**
 * A `list_filter` entry.
 *
 * `choice` filters may declare `"distinct"` instead of a fixed vocabulary,
 * which is what Django did for a plain char column: the options are the values
 * actually present, in alphabetical order.
 */
export type ListFilter =
  | { key: string; label: string; kind: "boolean"; column: PgColumn }
  | {
      key: string;
      label: string;
      kind: "choice";
      column: PgColumn;
      choices: FilterChoice[] | "distinct";
    }
  | { key: string; label: string; kind: "date"; column: PgColumn };

export type AdminListModel<Row> = {
  /** Matches the registry key, and therefore the URL. */
  key: string;
  /** The Drizzle select shape. Its result is what `Row` describes. */
  select: Record<string, PgColumn | SQL>;
  from: PgTable;
  /** The primary-key column, for looking one row up by id. */
  pk: PgColumn;
  columns: ListColumn<Row>[];
  filters?: ListFilter[];
  /**
   * `search_fields`. Terms are split on whitespace and ANDed, each term ORed
   * across the fields -- Django's rule, and the one that makes a two-word
   * query narrow the results instead of widening them.
   */
  search?: { fields: (PgColumn | SQL)[]; placeholder: string };
  defaultSort: { key: string; dir: "asc" | "desc" };
  /** The row's primary key, for the change-form link. */
  rowId: (row: Row) => number;
  perPage?: number;
};

export const ADMIN_PER_PAGE = 25;

// --- request parameters ------------------------------------------------------

export type ListParams = {
  q: string;
  page: number;
  sort: string;
  dir: "asc" | "desc";
  /** Only keys the model declares a filter for; anything else is dropped. */
  filters: Record<string, string>;
};

/**
 * Read the querystring.
 *
 * The parameter names are readable (`?q=`, `?page=`, `?sort=`, `?dir=`) rather
 * than Django's positional `?o=1.-2` and `?is_featured__exact=1`. Nothing links
 * to the old URLs -- the admin is behind a sign-in and `noindex` -- so there
 * was no scheme to preserve, and a sort key that names its column survives a
 * column being inserted before it.
 *
 * Every value is validated against the descriptor: a `?sort=` naming an unknown
 * or unsortable column falls back to the default rather than reaching SQL.
 */
export function readListParams<Row>(
  model: AdminListModel<Row>,
  searchParams: Record<string, string | string[] | undefined>,
): ListParams {
  const one = (key: string): string => {
    const raw = searchParams[key];
    return (Array.isArray(raw) ? raw[0] : raw) ?? "";
  };

  const requested = one("sort");
  const sortable = model.columns.find((column) => column.key === requested && column.sort);
  const page = Number(one("page"));

  const filters: Record<string, string> = {};
  for (const filter of model.filters ?? []) {
    const value = one(filter.key);
    if (value) filters[filter.key] = value;
  }

  return {
    q: one("q").trim(),
    page: Number.isFinite(page) && page >= 1 ? Math.trunc(page) : 1,
    // An unsortable `?sort=` takes the default column *and* the default
    // direction: honouring `?dir=` against a column the reader did not choose
    // would silently reverse the list they expected.
    sort: sortable ? requested : model.defaultSort.key,
    dir: sortable
      ? one("dir") === "desc"
        ? "desc"
        : "asc"
      : model.defaultSort.dir,
    filters,
  };
}

// --- date filtering ----------------------------------------------------------

/**
 * The four windows Django's `DateFieldListFilter` offered, beside "any date".
 *
 * Boundaries are calendar days in Asia/Jakarta, which is what `TIME_ZONE` made
 * them: "today" has to mean the site owner's today, not UTC's. WIB is a fixed
 * +07:00 -- Indonesia has had no daylight saving since 1964 -- so the offset is
 * written literally rather than looked up per date.
 */
export const DATE_FILTER_CHOICES: FilterChoice[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Past 7 days" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
];

const JAKARTA_OFFSET = "+07:00";

/** `YYYY-MM-DD` for the current Jakarta day. */
function jakartaToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

/** The instant a Jakarta calendar day begins, as a string Postgres reads. */
function jakartaStart(date: string): string {
  return `${date}T00:00:00${JAKARTA_OFFSET}`;
}

function dateFloor(value: string): string | null {
  const today = jakartaToday();
  const [year, month] = today.split("-");

  switch (value) {
    case "today":
      return jakartaStart(today);
    case "week": {
      const back = new Date(`${today}T00:00:00Z`);
      back.setUTCDate(back.getUTCDate() - 7);
      return jakartaStart(back.toISOString().slice(0, 10));
    }
    case "month":
      return jakartaStart(`${year}-${month}-01`);
    case "year":
      return jakartaStart(`${year}-01-01`);
    default:
      return null;
  }
}

// --- the query ---------------------------------------------------------------

function searchCondition<Row>(model: AdminListModel<Row>, q: string): SQL | undefined {
  const search = model.search;
  if (!q || !search) return undefined;

  const terms = q.split(/\s+/).filter(Boolean);
  const perTerm = terms.map((term) =>
    or(...search.fields.map((field) => ilike(field, `%${term}%`))),
  );
  return and(...perTerm);
}

function filterConditions<Row>(model: AdminListModel<Row>, params: ListParams): SQL[] {
  const conditions: SQL[] = [];

  for (const filter of model.filters ?? []) {
    const value = params.filters[filter.key];
    if (!value) continue;

    if (filter.kind === "boolean") {
      if (value !== "1" && value !== "0") continue;
      conditions.push(sql`${filter.column} = ${value === "1"}`);
    } else if (filter.kind === "choice") {
      conditions.push(sql`${filter.column} = ${value}`);
    } else {
      const floor = dateFloor(value);
      if (floor) conditions.push(gte(filter.column, sql`${floor}::timestamptz`));
    }
  }

  return conditions;
}

export type AdminListPage<Row> = {
  rows: Row[];
  total: number;
  page: number;
  pages: number;
  range: (number | "...")[];
};

/**
 * Run the changelist query.
 *
 * The cast on the row shape is the one place typing is given up: a descriptor
 * declares its select shape and its `Row` type side by side in the same file,
 * and Drizzle offers no public helper to infer the second from the first for an
 * arbitrary shape. Everything downstream -- the columns, the sort keys, the
 * link builder -- is checked against `Row`.
 */
export async function fetchAdminList<Row>(
  model: AdminListModel<Row>,
  params: ListParams,
): Promise<AdminListPage<Row>> {
  const perPage = model.perPage ?? ADMIN_PER_PAGE;

  const conditions = filterConditions(model, params);
  const search = searchCondition(model, params.q);
  if (search) conditions.push(search);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const chosen = model.columns.find((column) => column.key === params.sort);
  const order = chosen?.sort ?? model.columns.find((column) => column.sort)?.sort;
  const direction = params.dir === "desc" ? desc : asc;

  const [counted] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(model.from)
    .where(where);

  const total = counted?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / perPage));
  // Clamped rather than 404'd, as Django's Paginator did: deleting the last row
  // of the last page must not leave a bookmarked `?page=` dead.
  const page = Math.min(Math.max(params.page, 1), pages);

  const rows = await db
    .select(model.select)
    .from(model.from)
    .where(where)
    .orderBy(...(order ? [direction(order)] : []))
    .limit(perPage)
    .offset((page - 1) * perPage);

  return { rows: rows as Row[], total, page, pages, range: pageRange(page, pages) };
}

/**
 * The options for a filter that reads its vocabulary from the data.
 *
 * One extra query per such filter, run only when the list is rendered. Django
 * did the same -- `list_filter` on a plain char column lists the values present,
 * not a fixed set -- and it is why `category` on the blog stays correct when a
 * post introduces a new one.
 */
export async function distinctChoices(
  from: PgTable,
  column: PgColumn,
): Promise<FilterChoice[]> {
  const rows = await db.selectDistinct({ value: column }).from(from).orderBy(asc(column));

  return rows
    .map((row) => String(row.value ?? ""))
    .filter(Boolean)
    .map((value) => ({ value, label: value }));
}

/**
 * One row by primary key, in the same shape the changelist shows.
 *
 * Reusing the descriptor's `select` rather than reading the whole table row is
 * what keeps a detail screen honest: it can only show what the list declared,
 * so the two cannot drift into disagreeing about what a record is.
 */
export async function fetchAdminRow<Row>(
  model: AdminListModel<Row>,
  id: number,
): Promise<Row | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const [row] = await db.select(model.select).from(model.from).where(eq(model.pk, id)).limit(1);
  return (row as Row) ?? null;
}
