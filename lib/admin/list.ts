import "server-only";

import { and, asc, desc, eq, gte, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

import { pageRange } from "@/lib/api/pagination";
import { db } from "@/lib/db/client";
import { isUuid } from "@/lib/utils/uuid";

/**
 * One generic changelist, driven by a per-model descriptor.
 *
 * A descriptor under `lib/admin/models/` says which columns to show, which
 * filters to offer, which fields to search and how to order; everything below
 * turns that into one SQL query. Sorting, filtering, searching and paging all
 * happen in Postgres rather than over a fetched array, because several of these
 * tables outgrow a page (101 skills, 64 projects, 62 applications), and a list
 * that silently sorts only the rows it already has is worse than one that does
 * not sort at all.
 *
 * **Foreign keys are displayed with a scalar subquery, not a join.** Both are
 * one query, but the subquery keeps a single table in `FROM` -- so filtering,
 * ordering, counting and paging compose without join plumbing that the row
 * query and the count query would each have to repeat identically. The targets
 * are small by construction (19 organizations, 2 legal documents) and every one
 * is looked up by primary key.
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
   * What to ORDER BY. Omitted means the column is computed in TypeScript, and
   * the header offers no sort: sorting on it would order the page by a value
   * the database cannot see.
   */
  sort?: SQL | PgColumn;
  /** The cell's value. Primitives only, so a descriptor needs no JSX. */
  value: (row: Row) => string | number | boolean | null;
};

export type FilterChoice = { value: string; label: string };

/**
 * A filter whose options are rows of another table, labelled by a column of it.
 *
 * Only values actually present are offered, not every row of the target table.
 * A filter listing options that match nothing is a list of dead ends -- and the
 * gap can be wide: the legal sections point at 2 documents out of however many
 * exist, and offering the rest invites a click that returns an empty page.
 */
export type RelatedChoices = { table: PgTable; value: PgColumn; label: PgColumn };

/**
 * A `list_filter` entry.
 *
 * `choice` filters may declare `"distinct"` instead of a fixed vocabulary: the
 * options are then the values actually present, in alphabetical order.
 */
export type ListFilter =
  /**
   * `column` may be an expression rather than a real column: the users screen
   * filters on `is_author`, which lives on `guestbook_userprofile` and is read
   * back through a subquery. The two lookup kinds below cannot do that, since
   * they select *from* the column's table.
   */
  | { key: string; label: string; kind: "boolean"; column: PgColumn | SQL }
  | {
      key: string;
      label: string;
      kind: "choice";
      column: PgColumn;
      choices: FilterChoice[] | "distinct" | RelatedChoices;
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
   * Terms are split on whitespace and ANDed, each term ORed across the fields.
   * That is what makes a two-word query narrow the results instead of widening
   * them, which is what someone typing a second word means by it.
   */
  search?: { fields: (PgColumn | SQL)[]; placeholder: string };
  defaultSort: { key: string; dir: "asc" | "desc" };
  /** The row's primary key, for the change-form link. */
  /** The row's uuid, used to build its edit URL. */
  rowId: (row: Row) => string;
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
 * The parameter names are readable (`?q=`, `?page=`, `?sort=`, `?dir=`) and
 * name their column rather than its position, so inserting a column into a
 * descriptor does not silently change what a bookmarked URL sorts by.
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
 * Four windows, beside "any date".
 *
 * Boundaries are calendar days in Asia/Jakarta: "today" has to mean the site
 * owner's today, not UTC's, or the filter goes wrong for seven hours out of
 * every twenty-four. WIB is a fixed +07:00 -- Indonesia has had no daylight
 * saving since 1964 -- so the offset is written literally rather than looked up
 * per date.
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
  // Clamped rather than 404'd: deleting the last row of the last page must not
  // leave a bookmarked `?page=` dead.
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
 * One extra query per such filter, run only when the list is rendered. It is
 * what keeps `category` on the blog correct when a post introduces a new one,
 * with nothing to remember to update.
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

/** The options for a foreign-key filter -- see `RelatedChoices`. */
export async function relatedChoices(
  from: PgTable,
  column: PgColumn,
  related: RelatedChoices,
): Promise<FilterChoice[]> {
  const rows = await db
    .selectDistinct({ value: related.value, label: related.label })
    .from(related.table)
    .where(inArray(related.value, db.select({ value: column }).from(from)))
    .orderBy(asc(related.label));

  return rows.map((row) => ({ value: String(row.value), label: String(row.label ?? row.value) }));
}

/**
 * A filter whose options have to be queried before it can render.
 *
 * A type predicate rather than a boolean, so the caller keeps the narrowing:
 * only `choice` filters can be looked up, and only those are guaranteed to
 * carry a real column rather than an expression.
 */
export type LookupFilter = Extract<ListFilter, { kind: "choice" }> & {
  choices: "distinct" | RelatedChoices;
};

export function needsLookup(filter: ListFilter): filter is LookupFilter {
  return filter.kind === "choice" && !Array.isArray(filter.choices);
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
  id: string,
): Promise<Row | null> {
  if (!isUuid(id)) return null;
  const [row] = await db.select(model.select).from(model.from).where(eq(model.pk, id)).limit(1);
  return (row as Row) ?? null;
}
