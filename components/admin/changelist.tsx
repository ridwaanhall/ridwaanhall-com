import type { Route } from "next";
import Link from "next/link";

import { CheckIcon, DashIcon, PlusIcon, SortIcon } from "@/components/admin/admin-icons";
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
import type { AdminEntry } from "@/lib/admin/registry";
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
      <form method="get" className="flex flex-wrap items-center gap-2">
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
            <input
              type="search"
              name="q"
              defaultValue={params.q}
              placeholder={model.search.placeholder}
              aria-label={model.search.placeholder}
              className="w-56 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 transition-colors hover:border-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 sm:w-72"
            />
            <button
              type="submit"
              className="rounded-md border border-zinc-800 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
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
            href={`/admin/${entry.key}` as Route}
            className="text-xs text-zinc-500 underline-offset-2 transition-colors hover:text-indigo-400 hover:underline"
          >
            Clear
          </Link>
        )}

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-zinc-500">
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
              href={`/admin/${entry.key}/new` as Route}
              className="inline-flex items-center gap-1 rounded-full border border-indigo-800 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-300 transition-colors hover:bg-indigo-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
            >
              <PlusIcon height={13} width={13} />
              Add
            </Link>
          )}
        </div>
      </form>

      {/* --- table --------------------------------------------------------- */}
      {/*
        `min-w-[46rem]` rather than `min-w-max`: with max-content the table takes
        whatever its longest cell wants, and a few 70-character slugs pushed the
        last two columns off the right of a 1440px screen. A floor lets the
        columns share the width they have and long values wrap, while still
        scrolling on a phone rather than crushing five columns into 390px.

        `contain: layout` is not decoration. Without it the table's 736px floor
        leaked out to the document even though the scroll container clipped it
        visually, and the whole page scrolled 78px sideways at 390px wide --
        `documentElement.scrollWidth` 468 against a 390 viewport, while `body`
        and every ancestor correctly reported 390. Measured against the fix:
        clipping the container, clipping any wrapper, `overflow-x: clip` on
        `main` or on `html`, `width: 100%`, `min-width: 0` and `flow-root` all
        changed nothing; only `contain: layout` (or the heavier `contain: paint`)
        did, because only those stop the subtree contributing to the initial
        containing block's scrollable overflow.
      */}
      <div className="custom-scroll [contain:layout] overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60">
              {model.columns.map((column) => {
                const active = params.sort === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      "px-3 py-2 text-xs font-medium tracking-wide text-zinc-400 uppercase",
                      isNumeric(column.kind) && "text-right",
                    )}
                    aria-sort={active ? (params.dir === "asc" ? "ascending" : "descending") : undefined}
                  >
                    {column.sort ? (
                      <Link
                        href={sortHref(entry.key, params, defaultSort, column.key)}
                        className={cn(
                          "inline-flex items-center gap-1 transition-colors hover:text-zinc-200",
                          active && "text-zinc-200",
                        )}
                      >
                        {column.label}
                        <SortIcon dir={active ? params.dir : null} className="text-zinc-600" />
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
                        "px-3 py-2 align-top",
                        isNumeric(column.kind) && "text-right tabular-nums",
                        // A date is short and fixed-width; letting it wrap
                        // turns "2026-01-23" into two lines and doubles the
                        // row's height for nothing.
                        atomic(column.kind) && "whitespace-nowrap",
                      )}
                    >
                      {columnIndex === 0 ? (
                        <Link
                          href={`/admin/${entry.key}/${id}` as Route}
                          className="font-medium text-zinc-200 transition-colors hover:text-indigo-400"
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
                <td colSpan={model.columns.length} className="px-3 py-10 text-center text-zinc-500">
                  {filtered
                    ? `No ${entry.labelPlural.toLowerCase()} match that.`
                    : `No ${entry.labelPlural.toLowerCase()} yet.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- pagination ---------------------------------------------------- */}
      {page.pages > 1 && (
        <nav className="flex flex-wrap items-center gap-1" aria-label="Pages">
          {page.range.map((entryPage, index) =>
            entryPage === "..." ? (
              <span key={`gap-${index}`} className="px-2 text-xs text-zinc-600">
                …
              </span>
            ) : (
              <Link
                key={entryPage}
                href={listHref(entry.key, params, defaultSort, { page: entryPage })}
                aria-current={entryPage === page.page ? "page" : undefined}
                className={cn(
                  "min-w-8 rounded-md border px-2 py-1 text-center text-xs transition-colors",
                  entryPage === page.page
                    ? "border-indigo-800 bg-indigo-500/10 text-indigo-400"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200",
                )}
              >
                {entryPage}
              </Link>
            ),
          )}
        </nav>
      )}
    </div>
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
