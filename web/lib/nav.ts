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
   * what Django expressed as `url_name in 'blog blog_detail'`. That was a
   * substring test on a string rather than a real membership check; a path
   * prefix says the same thing and cannot match by accident.
   */
  matchNested?: boolean;
  /** Hidden entirely when the guestbook feature flag is off. */
  requiresGuestbook?: boolean;
};

/**
 * The primary navigation, in order.
 *
 * One definition, rendered by both the desktop rail and the mobile drawer. In
 * Django these were two hand-maintained copies of the same seven links, each
 * with its icon inlined twice.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: HomeIcon },
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { label: "Projects", href: "/projects", icon: ProjectsIcon, matchNested: true },
  { label: "Blog", href: "/blog", icon: BlogIcon, matchNested: true },
  { label: "About", href: "/about", icon: AboutIcon },
  { label: "Contact", href: "/contact", icon: ContactIcon },
  { label: "Guestbook", href: "/guestbook", icon: GuestbookIcon, requiresGuestbook: true },
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
