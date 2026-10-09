/**
 * The Writing index's filters, and their defaults.
 *
 * A plain module for the reason `work-filters.ts` is one: the page parses the
 * address on the server and the index writes it back as it changes, and a
 * constant exported from a `"use client"` module reaches a server component
 * as a client reference rather than as the value.
 */
export type WritingSort = "new" | "old" | "az" | "read";

export type WritingFilters = {
  q: string;
  topic: string;
  sort: WritingSort;
  view: "rows" | "grid";
};

export const DEFAULT_WRITING_FILTERS: WritingFilters = { q: "", topic: "", sort: "new", view: "rows" };

const SORTS: WritingSort[] = ["new", "old", "az", "read"];

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

/** The filters a URL asks for, read leniently -- these come from an address bar. */
export function parseWritingFilters(raw: Record<string, string | string[] | undefined>): WritingFilters {
  const sort = one(raw.sort) as WritingSort;
  return {
    q: one(raw.q).trim(),
    topic: one(raw.topic),
    sort: SORTS.includes(sort) ? sort : DEFAULT_WRITING_FILTERS.sort,
    view: one(raw.view) === "grid" ? "grid" : DEFAULT_WRITING_FILTERS.view,
  };
}

/** The filters as a query string, defaults left out, so a filtered list is a URL. */
export function writingFiltersToSearch(filters: WritingFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.topic) params.set("topic", filters.topic);
  if (filters.sort !== DEFAULT_WRITING_FILTERS.sort) params.set("sort", filters.sort);
  if (filters.view !== DEFAULT_WRITING_FILTERS.view) params.set("view", filters.view);
  const search = params.toString();
  return search ? `?${search}` : "";
}

/** Posts in the order asked for. Newest and oldest read the date, which is a year-month label, so they sort on `time`. */
export function sortPosts<T extends { title: string; views: number; time: number }>(posts: T[], sort: WritingSort): T[] {
  const list = [...posts];
  if (sort === "old") return list.sort((a, b) => a.time - b.time);
  if (sort === "az") return list.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "read") return list.sort((a, b) => b.views - a.views || b.time - a.time);
  return list.sort((a, b) => b.time - a.time);
}
