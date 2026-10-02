"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";

import { SearchIcon } from "@/components/icons/nav-icons";
import { BUTTON_SECONDARY } from "@/components/site/ui";

/**
 * The listing search: a plain GET form, so a search is a URL.
 *
 * `#searchInput` and `#searchButton` are kept from the version before the
 * redesign; the button stays disabled until there is something to search for.
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
    <form method="get" action="" role="search" className="flex w-full items-center gap-2 sm:max-w-md">
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          name="q"
          id="searchInput"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-10 w-full rounded-lg border border-zinc-800 bg-transparent pr-3 pl-9 text-sm text-zinc-100 transition-colors placeholder:text-zinc-500 hover:border-zinc-700 focus:border-zinc-500 focus:outline-none"
        />
      </div>
      <button type="submit" id="searchButton" disabled={!enabled} className={`${BUTTON_SECONDARY} cursor-pointer`}>
        Search
      </button>
      {query && (
        <Link
          href={basePath as Route}
          className="link-draw ml-1 text-sm whitespace-nowrap text-zinc-400 hover:text-zinc-100"
        >
          Clear
        </Link>
      )}
    </form>
  );
}
