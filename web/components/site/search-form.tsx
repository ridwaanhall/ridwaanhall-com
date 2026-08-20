import type { Route } from "next";
import Link from "next/link";

import { SearchIcon } from "@/components/icons/nav-icons";

/**
 * The listing search box.
 *
 * A plain GET form, not a controlled input filtering client-side. The result of
 * a search is a URL -- `?q=django` -- which can be linked, shared, bookmarked
 * and reloaded, and which the server can answer with a SQL `WHERE` instead of
 * shipping every row to the browser to filter. It also works with no JS.
 *
 * `action=""` submits to the current path, which drops any `?page=` along with
 * it. That is the behaviour you want: a new search starts at page 1, and
 * carrying page 4 into a two-page result would land on a clamped page.
 */
export function SearchForm({
  placeholder,
  query,
  basePath,
}: {
  placeholder: string;
  query: string;
  basePath: string;
}) {
  return (
    <form
      method="get"
      action=""
      className="flex flex-row gap-2 items-center w-full sm:max-w-sm md:max-w-md"
    >
      <div className="relative flex-1">
        <input
          type="text"
          name="q"
          id="searchInput"
          defaultValue={query}
          placeholder={placeholder}
          className="search-input"
          aria-label={placeholder}
        />
      </div>
      <button type="submit" id="searchButton" className="search-submit-btn">
        <SearchIcon className="w-5 h-5 text-zinc-400 mr-1" />
        Search
      </button>
      {query && (
        <Link
          href={basePath as Route}
          className="ml-2 text-sm text-zinc-400 hover:text-zinc-200 underline whitespace-nowrap"
        >
          Clear
        </Link>
      )}
    </form>
  );
}
