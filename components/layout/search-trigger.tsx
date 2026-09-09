"use client";

import { CommandIcon, SearchIcon } from "@/components/icons/nav-icons";
import { useSearchModal } from "@/components/layout/search-modal";

/**
 * The way into the search palette, as a box or as a button.
 *
 * A button rather than an input in either shape: it opens the modal, which owns
 * the real field.
 *
 * **The compact one is the same control with less of it showing.** In the
 * drawer there is a column to fill, so the box spans it and spells out both the
 * word and the shortcut. In the navbar there is a row to share, so it shrinks
 * to the glyph and earns the label back at `xl` -- which is why it carries an
 * `aria-label`: below that width the button has no text at all, and `ml-auto`
 * has nothing to push against in a control the width of its contents.
 *
 * `data-search-trigger` is here because both copies are in the document at
 * every width and only one of them is on screen. A harness that picked by
 * position rather than by visibility would click whichever the source order
 * happened to put last.
 */
export function SearchTrigger({
  tabIndex,
  variant = "block",
}: {
  tabIndex?: number;
  /** `"block"` fills a column; `"compact"` shares a row. */
  variant?: "block" | "compact";
}) {
  const { open } = useSearchModal();

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={open}
        tabIndex={tabIndex}
        aria-label="Search"
        data-search-trigger
        className="inline-flex cursor-pointer items-center rounded-lg border border-zinc-700 px-2 py-1.5 text-left text-sm text-zinc-400 xl:px-3"
      >
        <SearchIcon className="w-4 h-4 text-zinc-400" />
        <span className="ml-2 hidden xl:inline">Search</span>
        <span className="ml-3 hidden xl:inline">
          <div className="flex items-center gap-0.5 rounded bg-zinc-800 px-1 py-0.5 text-xs text-zinc-400">
            <CommandIcon />
            <span className="mt-0.5">k</span>
          </div>
        </span>
      </button>
    );
  }

  return (
    <div className="px-3 mb-3">
      <button
        type="button"
        onClick={open}
        tabIndex={tabIndex}
        data-search-trigger
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
