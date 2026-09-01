import type { Route } from "next";

import type { ListParams } from "@/lib/admin/list";
import { adminPath, type AdminEntry } from "@/lib/admin/registry";

export type SortDefault = { key: string; dir: "asc" | "desc" };

/**
 * Build a changelist URL from the parameters currently in force.
 *
 * Every control on the list -- a column heading, a page number, clearing a
 * filter -- changes exactly one thing and must carry the rest across. Doing
 * that inline in each component is how a search silently gets dropped by the
 * pagination, so all of them go through here.
 *
 * It takes the entry rather than its key because the base is `adminPath`'s to
 * decide: one segment for an ordinary model, two for a vocabulary that is a tab
 * on a Settings section. Anything at its default is left out, which keeps
 * `/admin/blog-post` as the URL of an untouched list rather than
 * `/admin/blog-post?q=&page=1&sort=created_at&dir=desc`.
 */
export function listHref(
  entry: AdminEntry,
  params: ListParams,
  defaultSort: SortDefault,
  overrides: Partial<ListParams> = {},
): Route {
  const merged: ListParams = {
    ...params,
    ...overrides,
    filters: { ...params.filters, ...(overrides.filters ?? {}) },
  };

  const search = new URLSearchParams();
  if (merged.q) search.set("q", merged.q);
  for (const [name, value] of Object.entries(merged.filters)) {
    if (value) search.set(name, value);
  }
  if (merged.sort !== defaultSort.key || merged.dir !== defaultSort.dir) {
    search.set("sort", merged.sort);
    search.set("dir", merged.dir);
  }
  if (merged.page > 1) search.set("page", String(merged.page));

  const query = search.toString();
  const base = adminPath(entry);
  return (query ? `${base}?${query}` : base) as Route;
}

/**
 * The href a column heading links to.
 *
 * Clicking the column already sorted reverses it; clicking any other column
 * starts it ascending. Either way the page resets to 1 -- staying on page 4 of
 * a differently-ordered list lands on rows that have nothing to do with the
 * ones that were on screen.
 */
export function sortHref(
  entry: AdminEntry,
  params: ListParams,
  defaultSort: SortDefault,
  column: string,
): Route {
  const dir: "asc" | "desc" = params.sort === column && params.dir === "asc" ? "desc" : "asc";
  return listHref(entry, params, defaultSort, { sort: column, dir, page: 1 });
}
