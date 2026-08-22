"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ActiveArrowIcon } from "@/components/icons/nav-icons";
import { isActive, visibleNavItems } from "@/lib/nav";
import { cn } from "@/lib/utils/cn";

/**
 * The primary nav list.
 *
 * Rendered by both the desktop rail and the mobile drawer from one definition;
 * `tabIndex` is the only thing that differs between them, because the drawer's
 * links must stay out of the tab order while it is closed.
 *
 * A client component only because it needs `usePathname` to mark the current
 * page. The active item is not a link -- it renders as a `role="button"` with
 * no href, matching Django, so a reader cannot navigate to the page they are
 * already on.
 */
export function NavLinks({ tabIndex }: { tabIndex?: number }) {
  const pathname = usePathname();

  return (
    <nav className="px-3 flex-grow">
      {visibleNavItems().map((item) => {
        const active = isActive(item, pathname);
        const Icon = item.icon;

        const content = (
          <>
            <Icon
              className={cn(
                "w-5 h-5 transition-transform duration-300 ease-in-out group-hover:-rotate-12",
                active ? "animate-pulse" : "text-zinc-400",
              )}
            />
            <span className="ml-2.5">{item.label}</span>
            {active && (
              <span className="ml-auto">
                <ActiveArrowIcon className="animate-pulse" />
              </span>
            )}
          </>
        );

        const className = cn(
          "flex group items-center px-3 py-2 mb-1 rounded-lg",
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
