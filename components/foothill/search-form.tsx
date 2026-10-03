"use client";

import Link from "next/link";
import { useState } from "react";

import { Icon } from "@/components/foothill/icons";
import { Roll } from "@/components/foothill/motion";

/**
 * Search inside a listing: a plain GET form, so it works before hydration and
 * the result is a URL that can be shared. The button waits for something to
 * search for.
 */
export function SearchForm({
  basePath,
  query,
  placeholder,
}: {
  basePath: "/blog" | "/projects";
  query: string;
  placeholder: string;
}) {
  const [value, setValue] = useState(query);

  return (
    <form
      action={basePath}
      method="get"
      role="search"
      className="group/search flex items-center gap-3 border-b border-line pb-1 transition-colors focus-within:border-ink"
    >
      <Icon name="search" className="h-5 w-5 text-mute transition-colors group-focus-within/search:text-ink" />
      <label htmlFor="searchInput" className="sr-only">
        {placeholder}
      </label>
      <input
        id="searchInput"
        name="q"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="h-12 min-w-0 flex-1 bg-transparent text-[18px] text-ink outline-none placeholder:text-mute [&::-webkit-search-cancel-button]:hidden"
      />
      {query && (
        <Link
          href={basePath}
          aria-label="Clear the search"
          className="flex h-9 w-9 items-center justify-center rounded-full text-mute transition-colors hover:bg-raise hover:text-ink"
        >
          <Icon name="close" />
        </Link>
      )}
      <button
        id="searchButton"
        type="submit"
        disabled={!value.trim()}
        className="group inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-ink px-4 text-[14px] font-medium text-paper transition-opacity disabled:cursor-default disabled:opacity-30"
      >
        <Roll>Search</Roll>
        <Icon name="arrow-right" className="h-3.5 w-3.5 transition-transform duration-500 group-enabled:group-hover:translate-x-0.5" />
      </button>
    </form>
  );
}
