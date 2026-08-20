"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";

import { SearchIcon } from "@/components/icons/nav-icons";

/**
 * The listing search box.
 *
 * A plain GET form, not a controlled filter over a client-side list. The result
 * of a search is a URL -- `?q=django` -- which can be linked, shared,
 * bookmarked and reloaded, and which the server answers with a SQL `WHERE`
 * instead of shipping every row to the browser. It still submits with no JS.
 *
 * `action=""` submits to the current path, which drops any `?page=` along with
 * it. That is the behaviour you want: a new search starts at page 1, and
 * carrying page 4 into a two-page result would land on a clamped page.
 *
 * The submit button is disabled until the field has something in it, which is
 * all `searchEnable.js` did -- except that it did it by assigning
 * `button.className` wholesale on DOMContentLoaded, which threw away the
 * `search-submit-btn` class the server had rendered and left the button
 * briefly wearing an uncoloured `border` (Tailwind v4 defaults border-color to
 * `currentColor`) until the script ran. Here the state is known while
 * rendering, so there is nothing to correct afterwards.
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
  const [value, setValue] = useState(query);
  const enabled = value.trim().length > 0;

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
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          className="search-input"
          aria-label={placeholder}
        />
      </div>
      <button
        type="submit"
        id="searchButton"
        disabled={!enabled}
        className={`search-submit-btn border-zinc-700 bg-zinc-800${
          enabled ? " hover:border-zinc-400 hover:bg-zinc-900 cursor-pointer" : ""
        }`}
      >
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
