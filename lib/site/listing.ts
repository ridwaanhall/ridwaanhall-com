/**
 * The request-dependent half of a listing page: `?q=` and `?page=`.
 *
 * Under Cache Components reading `searchParams` makes a component dynamic, so
 * a listing page keeps its heading in the static shell and reads these only
 * inside the `<Suspense>` boundary around its results. The results still
 * arrive in the first response: streaming sends them later in the same HTML,
 * not in a second request.
 */
export type ListingSearchParams = Promise<{ q?: string; page?: string }>;

/** `?q=` and `?page=`, parsed leniently -- these come from a URL bar. */
export async function readListingParams(searchParams: ListingSearchParams) {
  const raw = await searchParams;
  return {
    query: (raw.q ?? "").trim(),
    // A non-numeric page falls back to 1 rather than 404ing.
    page: Math.max(1, Number.parseInt(raw.page ?? "1", 10) || 1),
  };
}

/** A listing URL with its query kept and page 1 left implicit. */
export function listingHref(basePath: string, query: string, page: number): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `${basePath}?${search}` : basePath;
}
