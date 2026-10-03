"use client";

import Link from "next/link";
import { useState } from "react";

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
    <form action={basePath} method="get" role="search" className="flex items-center gap-4 border-b border-ink pb-1">
      <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-mute" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M13.5 13.5 L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
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
        className="h-11 min-w-0 flex-1 bg-transparent text-[17px] text-ink outline-none placeholder:text-mute [&::-webkit-search-cancel-button]:hidden"
      />
      {query && (
        <Link href={basePath} className="fh-mono text-[11px] tracking-[0.1em] text-mute uppercase hover:text-ink">
          Clear
        </Link>
      )}
      <button
        id="searchButton"
        type="submit"
        disabled={!value.trim()}
        className="fh-mono cursor-pointer text-[11px] tracking-[0.1em] text-ink uppercase disabled:cursor-default disabled:text-mute"
      >
        Search
      </button>
    </form>
  );
}
