"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ActiveArrowIcon } from "@/components/icons/nav-icons";
import { isActive, visibleNavItems } from "@/lib/nav";
import { cn } from "@/lib/utils/cn";

/**
 * The primary nav list, in a column or in a row.
 *
 * Rendered by both the navbar and the mobile drawer from one definition, which
 * is what keeps the two from drifting apart on which pages exist. Two things
 * differ: `tabIndex`, because the drawer's links must stay out of the tab order
 * while it is closed, and `variant`, because a row is not a column with
 * different padding.
 *
 * **The row drops the arrow and keeps the plate.** In the column the current
 * page is marked twice -- a filled plate and an arrow pushed to the far edge by
 * `ml-auto` -- and that second mark depends on the item being as wide as its
 * container. A row's items are as wide as their labels, so the arrow would land
 * against the text as a third glyph rather than at an edge. What remains says
 * the same thing: the plate, and the icon's own pulse.
 *
 * Every class is written out per variant rather than composed from the branch.
 * Tailwind emits only what it can see, and a row's geometry differs in five
 * places from a column's -- a conditional fragment of a class string is how a
 * variant ends up with no rule at all.
 *
 * A client component only because it needs `usePathname` to mark the current
 * page. The active item is not a link -- it renders as a `role="button"` with
 * no href, so a reader cannot navigate to the page they are already on.
 */
export function NavLinks({
  tabIndex,
  variant = "column",
}: {
  tabIndex?: number;
  /** `"column"` is the drawer's; `"row"` is the navbar's. */
  variant?: "column" | "row";
}) {
  const pathname = usePathname();
  const row = variant === "row";

  return (
    <nav
      className={
        row ? "hidden shrink-0 items-center gap-0.5 lg:flex" : "px-3 flex-grow"
      }
    >
      {visibleNavItems().map((item) => {
        const active = isActive(item, pathname);
        const Icon = item.icon;

        const content = (
          <>
            <Icon
              className={cn(
                row ? "w-4 h-4" : "w-5 h-5",
                // The branch is what keeps one animation on the icon at a time:
                // the current item is not a link, has no hover state and pulses
                // instead, so it never wants the shake as well.
                active ? "animate-pulse" : "text-zinc-400 icon-shake",
              )}
            />
            <span className={row ? "ml-2" : "ml-2.5"}>{item.label}</span>
            {!row && active && (
              <span className="ml-auto">
                <ActiveArrowIcon className="animate-pulse" />
              </span>
            )}
          </>
        );

        const className = cn(
          row
            ? "flex group shrink-0 items-center rounded-lg px-2.5 py-1.5 text-sm"
            : "flex group items-center px-3 py-2 mb-1 rounded-lg",
          active ? "bg-zinc-800" : "hover:bg-zinc-800",
        );

        return active ? (
          <div key={item.href} role="button" className={className} tabIndex={tabIndex}>
            {content}
          </div>
        ) : (
          <Link key={item.href} href={item.href} className={className} tabIndex={tabIndex}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
