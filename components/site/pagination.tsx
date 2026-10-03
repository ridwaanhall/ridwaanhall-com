import type { Route } from "next";
import Link from "next/link";

import { ArrowFx, RollLabel } from "@/components/motion/interactive";
import type { Paginated } from "@/lib/api/pagination";

/** Everything the bar needs to draw itself; the items are none of its business. */
type PageState = Pick<
  Paginated<unknown>,
  "page" | "pages" | "page_range" | "has_previous" | "has_next"
>;

/**
 * How one *navigable* cell is drawn -- an `<a>` for a listing, a `<button>` for
 * a list that pages in place. The bar owns the class strings and passes them in,
 * so the two kinds of cell cannot drift apart.
 */
type Cell = (
  n: number,
  className: string,
  content: React.ReactNode,
  label?: string,
) => React.ReactNode;

const CHEVRON_CELL =
  "page-cell rounded-full text-sm text-zinc-400 transition-colors duration-300 hover:bg-zinc-900 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";
const NUMBER_CELL =
  "page-cell rounded-full text-sm tabular-nums text-zinc-400 transition-colors duration-300 hover:bg-zinc-900 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";

/**
 * The bar itself.
 *
 * The elided range (always page 1 and the last page, a window of two either
 * side of the current one, "..." across the gaps) is computed in
 * `lib/api/pagination.ts`.
 *
 * The current page and the two dead ends are rendered here rather than through
 * `cell`: none of them goes anywhere, so there is nothing for a caller to
 * decide about them.
 */
function PaginationBar({ page, cell }: { page: PageState; cell: Cell }) {
  if (page.pages <= 1) return null;

  return (
    <nav className="flex justify-center" aria-label="Pagination">
      <ul className="inline-flex items-center gap-1">
        <li>
          {page.has_previous ? (
            cell(page.page - 1, CHEVRON_CELL, <ChevronLeft />, "Previous page")
          ) : (
            <span
              className="page-cell rounded-full text-sm text-zinc-700 cursor-not-allowed"
              aria-disabled="true"
            >
              <ChevronLeft />
            </span>
          )}
        </li>

        {page.page_range.map((item, index) =>
          item === "..." ? (
            // The ellipses are not interactive, so their position is the only
            // thing that identifies them.
            <li key={`gap-${index}`}>
              <span className="page-cell text-zinc-500">...</span>
            </li>
          ) : item === page.page ? (
            <li key={item}>
              <span
                aria-current="page"
                className="page-cell rounded-full bg-zinc-100 text-sm font-medium tabular-nums text-black"
              >
                {item}
              </span>
            </li>
          ) : (
            <li key={item}>{cell(item, NUMBER_CELL, <RollLabel>{String(item)}</RollLabel>)}</li>
          ),
        )}

        <li>
          {page.has_next ? (
            cell(page.page + 1, CHEVRON_CELL, <ChevronRight />, "Next page")
          ) : (
            <span
              className="page-cell rounded-full text-sm text-zinc-700 cursor-not-allowed"
              aria-disabled="true"
            >
              <ChevronRight />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}

/**
 * Page navigation for the blog and project listings.
 *
 * Links are real `<a>` hrefs carrying `?page=` and the current `?q=`, not
 * click handlers -- a page of a listing is a distinct URL that should be
 * linkable, shareable and crawlable, and it is what the sitemap advertises.
 */
export function Pagination({
  page,
  basePath,
  query,
}: {
  page: PageState;
  /** "/blog" or "/projects". */
  basePath: string;
  /** The active search term, preserved across pages. */
  query?: string;
}) {
  // Built from a base path plus query params, so `typedRoutes` cannot check it
  // statically. The two callers pass literal paths that do exist.
  const href = (n: number): Route => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    // Page 1 is the bare path, so the canonical URL has no redundant `?page=1`.
    if (n > 1) params.set("page", String(n));
    const search = params.toString();
    return (search ? `${basePath}?${search}` : basePath) as Route;
  };

  return (
    <PaginationBar
      page={page}
      cell={(n, className, content, label) => (
        <Link href={href(n)} className={className} aria-label={label}>
          {content}
        </Link>
      )}
    />
  );
}

/**
 * The same bar, driven by a callback instead of hrefs.
 *
 * For a list that has no URL of its own to page through -- the applications on
 * `/about` live inside a tab whose selection is client state, so `?page=3` would
 * name a page nobody arriving at the link would be looking at.
 *
 * This module carries no `"use client"` of its own: the listings render
 * `Pagination` on the server, and a client component importing this one pulls it
 * into its own graph. Only this export attaches a handler, and only that graph
 * ever renders it.
 */
export function PaginationButtons({
  page,
  onPageChange,
}: {
  page: PageState;
  onPageChange: (n: number) => void;
}) {
  return (
    <PaginationBar
      page={page}
      cell={(n, className, content, label) => (
        <button
          type="button"
          onClick={() => onPageChange(n)}
          // A button does not get the pointer an anchor does, and the two are
          // meant to feel like the same control.
          className={`${className} cursor-pointer`}
          aria-label={label}
        >
          {content}
        </button>
      )}
    />
  );
}

/*
 * Arrows rather than chevrons, so paging moves the way every other "go" on the
 * site does. A dead end draws the same arrow; it travels only on hover, and a
 * disabled cell is drawn too dim to invite one.
 */
function ChevronLeft() {
  return <ArrowFx direction="left" className="h-4 w-4" />;
}

function ChevronRight() {
  return <ArrowFx direction="right" className="h-4 w-4" />;
}
