import type { Route } from "next";
import Link from "next/link";

import {
  BackIcon,
  CheckIcon,
  DashIcon,
  ForwardIcon,
  PlusIcon,
  SearchIcon,
  SortIcon,
} from "@/components/admin/admin-icons";
import { FilterSelect } from "@/components/admin/filter-select";
import { adminDate, adminDateTime } from "@/lib/admin/format";
import { listHref, sortHref } from "@/lib/admin/href";
import {
  DATE_FILTER_CHOICES,
  type AdminListModel,
  type AdminListPage,
  type ColumnKind,
  type FilterChoice,
  type ListParams,
} from "@/lib/admin/list";
import { adminPath, type AdminEntry } from "@/lib/admin/registry";
import { cn } from "@/lib/utils/cn";

/**
 * The changelist, rendered from a descriptor.
 *
 * One component for every model. Everything it needs -- which columns, which of
 * them sort, what the filters offer, what the search covers -- comes from
 * `lib/admin/models/`, so a new screen is a descriptor, never a copy of this
 * file.
 *
 * It is a server component and stays one. Sorting, filtering, searching and
 * paging are all expressed in the URL and answered by SQL, which means the back
 * button works, a filtered list can be bookmarked and linked, and no table
 * state has to be shipped to the browser and kept in step with the server's.
 */
export function Changelist<Row>({
  entry,
  model,
  params,
  page,
  filterChoices,
  canCreate,
}: {
  entry: AdminEntry;
  model: AdminListModel<Row>;
  params: ListParams;
  page: AdminListPage<Row>;
  /** Options for any filter declaring `"distinct"`, resolved by the page. */
  filterChoices: Record<string, FilterChoice[]>;
  /** Whether this model has a form, and one that may create. */
  canCreate: boolean;
}) {
  const { defaultSort } = model;
  const filtered = params.q !== "" || Object.keys(params.filters).length > 0;

  return (
    <div className="space-y-4">
      {/* --- toolbar ------------------------------------------------------- */}
      {/*
        One bordered strip rather than controls floating on the page. The
        toolbar and the table are two halves of the same object, and giving the
        toolbar a surface of its own is what stops the filters reading as page
        furniture that happens to sit above a table.
      */}
      <form
        method="get"
        className="flex flex-wrap items-center gap-x-2 gap-y-2.5 rounded-lg border border-zinc-800 bg-zinc-950/40 p-2.5"
      >
        {/* Sorting is not a form control, so it has to ride along as hidden
            fields or every search would silently reset the order. `page` is
            deliberately absent: a new search starts at page 1. */}
        {(params.sort !== defaultSort.key || params.dir !== defaultSort.dir) && (
          <>
            <input type="hidden" name="sort" value={params.sort} />
            <input type="hidden" name="dir" value={params.dir} />
          </>
        )}

        {model.search && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon
                aria-hidden="true"
                height={14}
                width={14}
                className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-zinc-600"
              />
              <input
                type="search"
                name="q"
                defaultValue={params.q}
                placeholder={model.search.placeholder}
                aria-label={model.search.placeholder}
                className="admin-search w-56 rounded-md border border-zinc-800 bg-zinc-900 py-1.5 pr-3 pl-8 text-sm text-zinc-200 placeholder-zinc-500 transition-colors hover:border-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 sm:w-72"
              />
            </div>
            <button
              type="submit"
              className="cursor-pointer rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
            >
              Search
            </button>
          </div>
        )}

        {(model.filters ?? []).map((filter) => (
          <FilterSelect
            key={filter.key}
            name={filter.key}
            label={filter.label}
            value={params.filters[filter.key] ?? ""}
            anyLabel={filter.kind === "date" ? "Any date" : "All"}
            choices={
              filter.kind === "boolean"
                ? [
                    { value: "1", label: "Yes" },
                    { value: "0", label: "No" },
                  ]
                : filter.kind === "date"
                  ? DATE_FILTER_CHOICES
                  : // A fixed vocabulary is used as declared; anything else --
                    // `"distinct"` or a foreign key -- was looked up by the page.
                    Array.isArray(filter.choices)
                    ? filter.choices
                    : (filterChoices[filter.key] ?? [])
            }
          />
        ))}

        {filtered && (
          <Link
            href={adminPath(entry) as Route}
            className="rounded-md px-1 text-xs text-zinc-500 underline-offset-2 transition-colors hover:text-indigo-400 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          >
            Clear
          </Link>
        )}

        <div className="ml-auto flex items-center gap-3">
          <span className="rounded-full border border-zinc-800 px-2.5 py-1 text-xs text-zinc-500 tabular-nums">
            {page.total}{" "}
            {page.total === 1 ? entry.label.toLowerCase() : entry.labelPlural.toLowerCase()}
            {filtered && " matching"}
          </span>
          {/*
            Outside the `<form>` in reading order but inside it in the DOM, which
            is deliberate: a `<Link>` nested in a form is still a link, and
            pulling it out would put the toolbar on two rows at every width.
          */}
          {canCreate && (
            <Link
              href={`${adminPath(entry)}/new` as Route}
              className="inline-flex items-center gap-1.5 rounded-full border border-indigo-800 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
            >
              <PlusIcon height={13} width={13} />
              Add
            </Link>
          )}
        </div>
      </form>

      {/* --- table --------------------------------------------------------- */}
      {/*
        `min-w-[45rem]` rather than `min-w-max`: with max-content the table takes
        whatever its longest cell wants, and a few 70-character slugs pushed the
        last two columns off the right of a 1440px screen. A floor lets the
        columns share the width they have and long values wrap, while still
        scrolling on a phone rather than crushing five columns into 390px.

        **The floor is `max-lg` only, and it is 45rem rather than 46.** Both
        numbers are measurements, not taste. The content column at exactly `lg`
        is 718px once the rail and the gutters are out of it, so the old 736px
        floor was 18px wider than the box it lived in and *every* changelist on
        a 1024px laptop scrolled sideways inside its own border -- protecting
        columns that had no need of it. And at `md` the column is 734px inside
        the border, which 736 also misses, by the 2px that is the border
        itself. 720px clears both and still forces the scroll at 390px, which
        is the one width the floor was ever for.

        `overflow-y-hidden` is not tidiness either. `overflow-x: auto` makes the
        browser compute `overflow-y` to `auto` as well, so this box is a
        *vertical* scroll container too -- and sub-pixel row heights left it a
        pixel or two of scrollable height, which draws a full-height scrollbar
        track down the side of a table with nothing to scroll. The box is always
        exactly as tall as its content, so `hidden` has nothing to cut off.

        `contain: layout` is not decoration. Without it the table's floor
        leaked out to the document even though the scroll container clipped it
        visually, and the whole page scrolled 78px sideways at 390px wide --
        `documentElement.scrollWidth` 468 against a 390 viewport, while `body`
        and every ancestor correctly reported 390. Measured against the fix:
        clipping the container, clipping any wrapper, `overflow-x: clip` on
        `main` or on `html`, `width: 100%`, `min-width: 0` and `flow-root` all
        changed nothing; only `contain: layout` (or the heavier `contain: paint`)
        did, because only those stop the subtree contributing to the initial
        containing block's scrollable overflow.

        No sticky header, and not for want of trying: `overflow-x: auto` makes
        the browser compute `overflow-y` to `auto` as well, so this wrapper is
        itself the nearest scroll container and a sticky `thead` would pin
        itself to a box that never scrolls. It would look like a header that
        simply does nothing.
      */}
      <div className="custom-scroll [contain:layout] overflow-x-auto overflow-y-hidden rounded-lg border border-zinc-800">
        <table className="w-full text-left text-sm max-lg:min-w-[45rem]">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60">
              {model.columns.map((column) => {
                const active = params.sort === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      "px-3 py-2.5 text-xs font-medium tracking-wide text-zinc-400 uppercase",
                      isNumeric(column.kind) && "text-right",
                    )}
                    aria-sort={active ? (params.dir === "asc" ? "ascending" : "descending") : undefined}
                  >
                    {column.sort ? (
                      <Link
                        href={sortHref(entry, params, defaultSort, column.key)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded transition-colors hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400",
                          active && "text-zinc-200",
                        )}
                      >
                        {column.label}
                        <SortIcon
                          dir={active ? params.dir : null}
                          className={active ? "text-indigo-400" : "text-zinc-600"}
                        />
                      </Link>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {page.rows.map((row, index) => {
              const id = model.rowId(row);
              return (
                <tr
                  key={id}
                  className={cn(
                    "admin-row admin-hover-row border-zinc-800/70 hover:bg-zinc-900/60",
                    index > 0 && "border-t",
                  )}
                  /*
                    Staggered, and capped at twelve steps. Past about a fifth of
                    a second the last row of a fifty-row page arrives long after
                    the eye has moved on, which reads as lag rather than polish.
                  */
                  style={{ animationDelay: `${Math.min(index, 12) * 18}ms` }}
                >
                  {model.columns.map((column, columnIndex) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-3 py-2.5 align-top",
                        isNumeric(column.kind) && "text-right tabular-nums",
                        // A date is short and fixed-width; letting it wrap
                        // turns "2026-01-23" into two lines and doubles the
                        // row's height for nothing.
                        atomic(column.kind) && "whitespace-nowrap",
                        /*
                          Everything else may break mid-token if it has to.
                          `anywhere` rather than `break-word` because only
                          `anywhere` lowers the column's *minimum* width, which
                          is the number that decides whether the table fits:
                          one 29-character email address held the user list
                          152px wider than the box it had to live in. It still
                          breaks only when a line would otherwise overflow, so
                          ordinary titles wrap at their spaces as before.
                        */
                        !atomic(column.kind) && "wrap-anywhere",
                      )}
                    >
                      {columnIndex === 0 ? (
                        <Link
                          href={`${adminPath(entry)}/${id}` as Route}
                          className="rounded font-medium text-zinc-200 transition-colors hover:text-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
                        >
                          {String(column.value(row) ?? "")}
                        </Link>
                      ) : (
                        <Cell kind={column.kind} value={column.value(row)} />
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}

            {page.rows.length === 0 && (
              <tr>
                <td colSpan={model.columns.length} className="px-3 py-12 text-center">
                  {/*
                    The wording is load-bearing as well as human:
                    `check-admin.mjs` reads "No blog posts match that." back out
                    of the response to prove a search that matches nothing said
                    so rather than quietly returning everything.
                  */}
                  <p className="text-sm text-zinc-500">
                    {filtered
                      ? `No ${entry.labelPlural.toLowerCase()} match that.`
                      : `No ${entry.labelPlural.toLowerCase()} yet.`}
                  </p>
                  {filtered ? (
                    <Link
                      href={adminPath(entry) as Route}
                      className="mt-2 inline-block rounded text-xs text-zinc-500 underline-offset-2 transition-colors hover:text-indigo-400 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
                    >
                      Clear the filters
                    </Link>
                  ) : (
                    canCreate && (
                      <Link
                        href={`${adminPath(entry)}/new` as Route}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-indigo-800 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
                      >
                        <PlusIcon height={13} width={13} />
                        Add the first one
                      </Link>
                    )
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- pagination ---------------------------------------------------- */}
      {page.pages > 1 && (
        <nav className="flex flex-wrap items-center gap-1" aria-label="Pages">
          <Step
            entry={entry}
            params={params}
            defaultSort={defaultSort}
            to={page.page - 1}
            disabled={page.page <= 1}
            label="Previous page"
          >
            <BackIcon height={13} width={13} />
          </Step>

          {page.range.map((entryPage, index) =>
            entryPage === "..." ? (
              <span key={`gap-${index}`} className="px-2 text-xs text-zinc-600">
                …
              </span>
            ) : (
              <Link
                key={entryPage}
                href={listHref(entry, params, defaultSort, { page: entryPage })}
                aria-current={entryPage === page.page ? "page" : undefined}
                className={cn(
                  "min-w-8 rounded-md border px-2 py-1 text-center text-xs tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400",
                  entryPage === page.page
                    ? "border-indigo-800 bg-indigo-500/10 text-indigo-400"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200",
                )}
              >
                {entryPage}
              </Link>
            ),
          )}

          <Step
            entry={entry}
            params={params}
            defaultSort={defaultSort}
            to={page.page + 1}
            disabled={page.page >= page.pages}
            label="Next page"
          >
            <ForwardIcon height={13} width={13} />
          </Step>

          <span className="ml-2 text-xs text-zinc-600 tabular-nums">
            Page {page.page} of {page.pages}
          </span>
        </nav>
      )}
    </div>
  );
}

/**
 * One end of the pager.
 *
 * A `<span>` when there is nowhere to go, not a link to the page you are on.
 * `aria-disabled` on an anchor still leaves it focusable and followable, and a
 * pager that answers the last page with the last page is a control that lies
 * about having done something.
 */
function Step({
  entry,
  params,
  defaultSort,
  to,
  disabled,
  label,
  children,
}: {
  entry: AdminEntry;
  params: ListParams;
  defaultSort: AdminListModel<unknown>["defaultSort"];
  to: number;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const className =
    "inline-flex min-w-8 items-center justify-center rounded-md border border-zinc-800 px-2 py-1 text-xs";

  if (disabled) {
    return (
      <span aria-hidden="true" className={cn(className, "text-zinc-700")}>
        {children}
      </span>
    );
  }

  return (
    <Link
      href={listHref(entry, params, defaultSort, { page: to })}
      aria-label={label}
      className={cn(
        className,
        "text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400",
      )}
    >
      {children}
    </Link>
  );
}

function isNumeric(kind: ColumnKind | undefined): boolean {
  return kind === "number";
}

/** Values that must never be broken across lines. */
function atomic(kind: ColumnKind | undefined): boolean {
  return kind === "number" || kind === "date" || kind === "datetime";
}

/** The non-linking cells. `kind` decides the treatment; the value stays raw. */
function Cell({ kind, value }: { kind: ColumnKind | undefined; value: string | number | boolean | null }) {
  if (kind === "bool") {
    return value ? (
      <span className="inline-flex items-center gap-1 text-green-400">
        <CheckIcon height={14} width={14} />
        <span className="sr-only">Yes</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-zinc-600">
        <DashIcon height={14} width={14} />
        <span className="sr-only">No</span>
      </span>
    );
  }

  if (value === null || value === "") return <span className="text-zinc-600">—</span>;

  if (kind === "date") return <span className="text-zinc-400 tabular-nums">{adminDate(String(value))}</span>;
  if (kind === "datetime")
    return <span className="text-zinc-400 tabular-nums">{adminDateTime(String(value))}</span>;
  if (kind === "code")
    // `break-all`, since a slug is one unbroken token and would otherwise set
    // the column's width by itself.
    return (
      <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-xs break-all text-zinc-400">
        {String(value)}
      </code>
    );
  if (kind === "muted") return <span className="text-zinc-500">{String(value)}</span>;

  return <span className="text-zinc-300">{String(value)}</span>;
}
