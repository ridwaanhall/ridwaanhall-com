"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AboutData } from "@/lib/data/about";
import { normalizePath } from "@/lib/nav";
import { useCurrentYear } from "@/lib/utils/use-current-year";

/**
 * The base of the sidebar: one ruled section holding the account and, under it,
 * the small print.
 *
 * **One section, one rule, one gutter.** These were two separately ruled bands
 * -- the account, then the legal links -- stacked at the bottom of a 248px
 * column, which put three horizontal lines within 90px of each other and needed
 * a border weight found nowhere else on the site to make them read as a pair.
 * They are one band now, on the same left edge as the profile block, the search
 * box and every nav item above them, and the rule is the quiet one the rest of
 * the site draws its sections with.
 *
 * The class is exported and the rail and the drawer each draw the element,
 * rather than this component wrapping both. Two things fall out of that: the
 * account panel -- a streamed `<Suspense>` element created in the layout --
 * stays a plain child of the node it belongs to instead of being handed
 * through a second component as a prop, and `SidebarFooter` stays what its
 * name says it is. A component called the footer that also had to accept and
 * forward somebody else's element would be two jobs under one name.
 */
export const SIDEBAR_BASE = "mt-auto border-t border-zinc-800 px-3 py-3";

/**
 * The legal links and the copyright, under whatever the account is doing.
 *
 * **Small print, drawn as small print.** It used to sit at the weight of the
 * controls beside it, separated by bullet glyphs. It is dimmer than them now
 * and separated by space: three nouns do not read as a sentence, every link
 * gets its own hit area, and the row can wrap without stranding a bullet at the
 * start of the next line -- which the version with them could not do at all.
 *
 * **The conditional link goes last.** OpenHire appears only while the profile
 * says so, so leading with it meant Privacy and Terms slid sideways whenever
 * that flag was flipped. The two permanent links are anchored and the optional
 * one is appended.
 *
 * Neither placement carries a theme toggle. The rail's lives in the `@username`
 * row and the drawer relies on the mobile navbar's, which stays reachable
 * whether the drawer is open or shut. A copy here would be a second visible
 * toggle at the same width.
 *
 * The way into the admin used to sit here as a bullet after "Terms", which put
 * the one screen a staff reader might actually want among the small print and
 * drew it like more of it; it is an account action and lives with the other
 * one, in the menu `AccountPanel` opens.
 */
export function SidebarFooter({ about }: { about: AboutData }) {
  const pathname = usePathname();
  const year = useCurrentYear();

  // The current page is named but not linked, so a reader cannot navigate to
  // where they already are.
  const item = (href: Route, label: string) =>
    normalizePath(pathname) === href ? (
      <span className="text-zinc-300">{label}</span>
    ) : (
      <Link
        href={href}
        className="rounded-sm transition-colors hover:text-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
      >
        {label}
      </Link>
    );

  return (
    <div className="mt-3 text-xs text-zinc-500">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {item("/privacy-policy", "Privacy")}
        {item("/terms", "Terms")}
        {(about.is_open_to_work || about.is_hiring) && item("/openhire", "OpenHire")}
      </div>
      <p className="mt-1.5">
        {/* An en dash, and only when there is a range to draw: a site read in
            its first year should not claim two of them. */}
        © {year > 2025 ? `2025–${year}` : "2025"} {about.name}
      </p>
    </div>
  );
}
