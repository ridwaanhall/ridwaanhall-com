"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AboutData } from "@/lib/data/about";
import { normalizePath } from "@/lib/nav";
import { useCurrentYear } from "@/lib/utils/use-current-year";

/**
 * The base of the mobile drawer: one ruled section holding the account and,
 * under it, the small print.
 *
 * **One section, one rule, one gutter.** These were two separately ruled bands
 * -- the account, then the legal links -- stacked at the bottom of a narrow
 * column, which put three horizontal lines within 90px of each other and needed
 * a border weight found nowhere else on the site to make them read as a pair.
 * They are one band now, on the same left edge as everything above them, and
 * the rule is the quiet one the rest of the site draws its sections with.
 *
 * The class is exported and the drawer draws the element, rather than a
 * component wrapping both halves. The account panel is a streamed `<Suspense>`
 * element created in the layout, and this way it stays a plain child of the node
 * it belongs to instead of being handed through a second component as a prop.
 */
export const DRAWER_BASE = "mt-auto border-t border-zinc-800 px-3 py-3";

/**
 * The legal links and the copyright.
 *
 * **Two placements, and only the axis differs.** In the drawer this sits under
 * the account in the band above, so it stacks. In the site footer it is the
 * only thing there, with a full row to itself, so the copyright moves out
 * beside the links once there is width for it -- below `sm` it stacks again,
 * because two short lines read better than one that wraps mid-sentence.
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
 * one is appended. It is also the one thing that still names the availability
 * flags on a screen too narrow for the navbar's chips.
 *
 * Neither placement carries a theme toggle. There is one in the document, in
 * the navbar, and it stays reachable whether the drawer is open or shut -- a
 * copy here would be a second visible toggle at the same width.
 *
 * The way into the admin used to sit here as a bullet after "Terms", which put
 * the one screen a staff reader might actually want among the small print and
 * drew it like more of it; it is an account action and lives with the other
 * one, in the menu `AccountPanel` opens.
 */
export function SmallPrint({
  about,
  variant = "drawer",
}: {
  about: AboutData;
  /** `"drawer"` stacks under the account row; `"page"` is the site footer's. */
  variant?: "drawer" | "page";
}) {
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

  const page = variant === "page";

  return (
    <div
      className={
        page
          ? "flex flex-col gap-2 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between"
          : "mt-3 text-xs text-zinc-500"
      }
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {item("/privacy-policy", "Privacy")}
        {item("/terms", "Terms")}
        {(about.is_open_to_work || about.is_hiring) && item("/openhire", "OpenHire")}
      </div>
      <p className={page ? undefined : "mt-1.5"}>
        {/* An en dash, and only when there is a range to draw: a site read in
            its first year should not claim two of them. */}
        © {year > 2025 ? `2025–${year}` : "2025"} {about.name}
      </p>
    </div>
  );
}
