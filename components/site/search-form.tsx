"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";

import { SearchIcon } from "@/components/icons/nav-icons";
import { LineText } from "@/components/motion/interactive";
import { BUTTON_SECONDARY, ButtonContent } from "@/components/site/ui";

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
        <SearchIcon className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          name="q"
          id="searchInput"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-11 w-full rounded-full border border-zinc-500 bg-transparent pr-4 pl-10 text-sm text-zinc-100 transition-colors duration-500 placeholder:text-zinc-500 hover:border-zinc-300 focus:border-zinc-100 focus:outline-none"
        />
      </div>
      <button type="submit" id="searchButton" disabled={!enabled} className={BUTTON_SECONDARY}>
        <ButtonContent label="Search" outlined />
      </button>
      {query && (
        <Link
          href={basePath as Route}
          className="ml-1 rounded-full text-sm whitespace-nowrap text-zinc-400 transition-colors hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
        >
          <LineText>Clear</LineText>
        </Link>
      )}
    </form>
  );
}
