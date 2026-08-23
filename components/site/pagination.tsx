import type { Route } from "next";
import Link from "next/link";

import type { Paginated } from "@/lib/api/pagination";

/**
 * Page navigation for the blog and project listings.
 *
 * The elided range (always page 1 and the last page, a window of two either
 * side of the current one, "..." across the gaps) is computed in
 * `lib/api/pagination.ts`, matching what `PaginatedView.paginate_items` built.
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
  page: Pick<Paginated<unknown>, "page" | "pages" | "page_range" | "has_previous" | "has_next">;
  /** "/blog" or "/projects". */
  basePath: string;
  /** The active search term, preserved across pages. */
  query?: string;
}) {
  if (page.pages <= 1) return null;

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
    <nav className="flex justify-center" aria-label="Pagination">
      <ul className="inline-flex items-center gap-0.5 sm:gap-1 rounded-lg p-0.5 sm:p-1 backdrop-blur-sm border border-zinc-800">
        <li>
          {page.has_previous ? (
            <Link
              href={href(page.page - 1)}
              className="page-cell rounded-md text-sm transition-all hover:bg-zinc-800 hover:text-zinc-200"
              aria-label="Previous page"
            >
              <ChevronLeft />
            </Link>
          ) : (
            <span
              className="page-cell rounded-md text-sm text-zinc-500 cursor-not-allowed"
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
                className="page-cell rounded-md bg-zinc-800 text-xs sm:text-sm font-medium"
              >
                {item}
              </span>
            </li>
          ) : (
            <li key={item}>
              <Link
                href={href(item)}
                className="page-cell rounded-md text-xs sm:text-sm transition-all hover:bg-zinc-800 hover:text-zinc-200"
              >
                {item}
              </Link>
            </li>
          ),
        )}

        <li>
          {page.has_next ? (
            <Link
              href={href(page.page + 1)}
              className="page-cell rounded-md text-sm transition-all hover:bg-zinc-800 hover:text-zinc-200"
              aria-label="Next page"
            >
              <ChevronRight />
            </Link>
          ) : (
            <span
              className="page-cell rounded-md text-sm text-zinc-500 cursor-not-allowed"
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

function ChevronLeft() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 sm:h-5 sm:w-5"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 sm:h-5 sm:w-5"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}
