"use client";

import { CommandIcon, SearchIcon } from "@/components/icons/nav-icons";
import { useSearchModal } from "@/components/layout/search-modal";

/**
 * The "Search ⌘k" box at the top of the rail and the drawer.
 *
 * A button rather than an input: it opens the modal, which owns the real field.
 */
export function SearchTrigger({ tabIndex }: { tabIndex?: number }) {
  const { open } = useSearchModal();

  return (
    <div className="px-3 mb-3">
      <button
        type="button"
        onClick={open}
        tabIndex={tabIndex}
        className="flex w-full items-center px-3 py-2 mb-1 rounded-lg border border-zinc-700 text-left cursor-pointer"
      >
        <SearchIcon className="w-5 h-5 text-zinc-400" />
        <span className="ml-2.5">Search</span>
        <span className="ml-auto">
          <div className="flex items-center gap-0.5 rounded bg-zinc-800 px-1 py-0.5 text-xs text-zinc-400">
            <CommandIcon />
            <span className="mt-0.5">k</span>
          </div>
        </span>
      </button>
    </div>
  );
}
