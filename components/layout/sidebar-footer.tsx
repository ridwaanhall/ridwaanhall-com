"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AboutData } from "@/lib/data/about";
import { normalizePath } from "@/lib/nav";
import { useCurrentYear } from "@/lib/utils/use-current-year";

/**
 * The legal/meta links and copyright under both the rail and the drawer.
 *
 * Neither placement carries a theme toggle. The rail's lives in the `@username`
 * row and the drawer relies on the mobile navbar's, which stays reachable
 * whether the drawer is open or shut. A copy here would be a second visible
 * toggle at the same width.
 *
 * Legal links only. The way into the admin used to sit here as a bullet after
 * "Terms", which put the one screen a staff reader might actually want among
 * the small print and drew it like more of it; it is an account action and
 * lives with the others, in `AccountPanel`.
 */
export function SidebarFooter({ about }: { about: AboutData }) {
  const pathname = usePathname();
  const year = useCurrentYear();
  const showOpenHire = about.is_open_to_work || about.is_hiring;

  // The current page is named but not linked, so a reader cannot navigate to
  // where they already are.
  const item = (href: Route, label: string) =>
    normalizePath(pathname) === href ? (
      <span className="text-zinc-300">{label}</span>
    ) : (
      <Link href={href} className="hover:text-zinc-300 transition-colors">
        {label}
      </Link>
    );

  return (
    <div className="px-6 py-4 mt-auto text-xs text-zinc-400 border-t border-zinc-700/80">
      <div className="flex items-center gap-1 mb-2">
        {showOpenHire && (
          <>
            {item("/openhire", "OpenHire")}
            <span className="text-zinc-600">•</span>
          </>
        )}
        {item("/privacy-policy", "Privacy")}
        <span className="text-zinc-600">•</span>
        {item("/terms", "Terms")}
      </div>
      <div className="flex items-center gap-2 text-zinc-500">
        <span>
          © 2025 - {year} {about.name}
        </span>
      </div>
    </div>
  );
}
