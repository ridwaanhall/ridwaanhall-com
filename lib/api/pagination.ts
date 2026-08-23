/** Page size for every public listing. One constant, so they all agree. */
export const ITEMS_PER_PAGE = 10;

export type Paginated<T> = {
  items: T[];
  page: number;
  pages: number;
  count: number;
  has_previous: boolean;
  has_next: boolean;
  page_range: (number | "...")[];
};

/**
 * An elided page range: always page 1 and the last page, a window of two either
 * side of the current page, and "..." across the gaps.
 *
 * Split out from `paginate` so the admin's changelist can share the rule. It
 * pages in SQL rather than over a fetched array -- several of its tables
 * outgrow a page -- so it has the counts but never the items.
 */
export function pageRange(current: number, pages: number): (number | "...")[] {
  const range: (number | "...")[] = [1];
  const windowStart = Math.max(2, current - 2);
  const windowEnd = Math.min(pages, current + 2);
  if (windowStart > 2) range.push("...");
  for (let n = windowStart; n <= windowEnd; n++) {
    if (n !== 1 && n !== pages) range.push(n);
  }
  if (windowEnd < pages - 1) range.push("...");
  if (pages > 1) range.push(pages);
  return range;
}

/** Slice a list into a page, with `pageRange`'s elided range alongside. */
export function paginate<T>(items: T[], page: number, perPage = ITEMS_PER_PAGE): Paginated<T> {
  const count = items.length;
  const pages = Math.max(1, Math.ceil(count / perPage));
  // Out-of-range never 404s: a non-integer falls back to page 1, and a page
  // past the end clamps to the last one, so a stale bookmark still lands.
  const current = Number.isFinite(page) ? Math.min(Math.max(Math.trunc(page), 1), pages) : 1;
  const start = (current - 1) * perPage;

  return {
    items: items.slice(start, start + perPage),
    page: current,
    pages,
    count,
    has_previous: current > 1,
    has_next: current < pages,
    page_range: pageRange(current, pages),
  };
}

/** Read `?page=`, defaulting to 1 for anything that is not a page number. */
export function pageParam(params: URLSearchParams): number {
  const raw = Number(params.get("page"));
  return Number.isFinite(raw) && raw >= 1 ? Math.trunc(raw) : 1;
}
