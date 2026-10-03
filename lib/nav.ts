import type { Route } from "next";
import type { ComponentType, SVGProps } from "react";

import {
  AboutIcon,
  BlogIcon,
  ContactIcon,
  DashboardIcon,
  GuestbookIcon,
  HomeIcon,
  ProjectsIcon,
} from "@/components/icons/nav-icons";

export type NavItem = {
  label: string;
  href: Route;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /**
   * Whether a nested path counts as this item being active. `/blog/<slug>/`
   * highlights Blog, and `/projects/<slug>/` highlights Projects -- which is
   * a path-prefix test rather than a set of route names to keep in step with
   * the routes themselves.
   */
  matchNested?: boolean;
  /** Hidden entirely when the guestbook feature flag is off. */
  requiresGuestbook?: boolean;
};

/**
 * The primary navigation, in order.
 *
 * One definition, rendered by the navbar, the mobile menu and the command
 * palette -- not three hand-maintained copies of the same seven links. The
 * labels name what a reader finds there (work, writing) rather than the
 * route; the hrefs are the routes and do not move.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: HomeIcon },
  { label: "Work", href: "/projects", icon: ProjectsIcon, matchNested: true },
  { label: "Writing", href: "/blog", icon: BlogIcon, matchNested: true },
  { label: "About", href: "/about", icon: AboutIcon },
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { label: "Guestbook", href: "/guestbook", icon: GuestbookIcon, requiresGuestbook: true },
  { label: "Contact", href: "/contact", icon: ContactIcon },
];

/**
 * Strip a trailing slash for comparison.
 *
 * `typedRoutes` generates route literals *without* one, while `trailingSlash:
 * true` means `usePathname()` reports one. Comparing the two directly silently
 * never matches, so every comparison goes through this.
 */
export function normalizePath(path: string): string {
  return path !== "/" && path.endsWith("/") ? path.slice(0, -1) : path;
}

/** Is `item` the page currently being viewed? */
export function isActive(item: Pick<NavItem, "href" | "matchNested">, pathname: string): boolean {
  const here = normalizePath(pathname);
  if (item.href === "/") return here === "/";
  return item.matchNested ? here === item.href || here.startsWith(`${item.href}/`) : here === item.href;
}

export const GUESTBOOK_ENABLED = process.env.NEXT_PUBLIC_GUESTBOOK_ENABLED !== "false";

export function visibleNavItems(): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.requiresGuestbook || GUESTBOOK_ENABLED);
}
