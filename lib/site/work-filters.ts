/**
 * The Work index's filters, and their defaults.
 *
 * A plain module because both sides read it: the page parses the address into
 * these on the server, and the explorer writes them back as they change. A
 * constant exported from a `"use client"` module reaches a server component
 * as a client reference rather than as the value -- `DEFAULT_FILTERS.sort`
 * read there as `undefined`, and the first change wrote `?sort=undefined`.
 */
export type WorkFilters = {
  q: string;
  kind: string;
  skill: string;
  /** A `project_status.slug`; empty is every status. */
  status: string;
  live: boolean;
  source: boolean;
  sort: "featured" | "new" | "az";
  view: "grid" | "rows";
};

export const DEFAULT_FILTERS: WorkFilters = {
  q: "",
  kind: "",
  skill: "",
  status: "",
  live: false,
  source: false,
  sort: "featured",
  view: "grid",
};

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

/** The filters a URL asks for, read leniently -- these come from an address bar. */
export function parseFilters(raw: Record<string, string | string[] | undefined>): WorkFilters {
  const sort = one(raw.sort);
  return {
    q: one(raw.q).trim(),
    kind: one(raw.kind),
    skill: one(raw.skill),
    status: one(raw.status),
    live: one(raw.live) === "1",
    source: one(raw.source) === "1",
    sort: sort === "new" || sort === "az" ? sort : DEFAULT_FILTERS.sort,
    view: one(raw.view) === "rows" ? "rows" : DEFAULT_FILTERS.view,
  };
}

/** The filters as a query string, defaults left out, so a filtered list is a URL. */
export function filtersToSearch(filters: WorkFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.kind) params.set("kind", filters.kind);
  if (filters.skill) params.set("skill", filters.skill);
  if (filters.status) params.set("status", filters.status);
  if (filters.live) params.set("live", "1");
  if (filters.source) params.set("source", "1");
  if (filters.sort !== DEFAULT_FILTERS.sort) params.set("sort", filters.sort);
  if (filters.view !== DEFAULT_FILTERS.view) params.set("view", filters.view);
  const search = params.toString();
  return search ? `?${search}` : "";
}
