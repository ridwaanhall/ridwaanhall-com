"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  ArticleIcon,
  BriefcaseIcon,
  ChatIcon,
  CloseIcon,
  CommentIcon,
  CubeIcon,
  MenuIcon,
  PersonIcon,
  ScaleIcon,
  UsersIcon,
} from "@/components/admin/admin-icons";
import { ADMIN_ENTRIES, ADMIN_GROUPS, entriesInGroup, type AdminGroup } from "@/lib/admin/registry";
import { cn } from "@/lib/utils/cn";

const GROUP_ICON: Record<AdminGroup, typeof PersonIcon> = {
  About: PersonIcon,
  Blog: ArticleIcon,
  Projects: CubeIcon,
  "Open to work": BriefcaseIcon,
  Legal: ScaleIcon,
  Guestbook: ChatIcon,
  Comments: CommentIcon,
  Users: UsersIcon,
};

/**
 * The admin's model index, as a rail on desktop and a drawer below `lg`.
 *
 * Grouped by area, in registry order, so the sidebar and the index page put
 * the same models in the same places.
 *
 * The public site's drawer is dismissed by drag, backdrop and Escape and has no
 * close button. This one keeps a close button on purpose: the admin is a tool
 * rather than a reading surface, it is used with a pointer far more often than
 * a thumb, and there is no navbar toggle left on screen once it is open.
 */
export function AdminSidebar({ signedInAs }: { signedInAs: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 inline-flex items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
        aria-label="Open admin navigation"
      >
        <MenuIcon height={18} width={18} />
      </button>

      {open && (
        <button
          type="button"
          aria-label="Close admin navigation"
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
        />
      )}

      <nav
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-800 bg-zinc-950 transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Admin sections"
      >
        <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="text-sm font-medium text-zinc-200 transition-colors hover:text-indigo-400"
          >
            Admin
          </Link>
          <span className="text-xs text-zinc-600">/</span>
          <span className="truncate text-xs text-zinc-500">{signedInAs}</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="lg:hidden ml-auto rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            aria-label="Close admin navigation"
          >
            <CloseIcon height={16} width={16} />
          </button>
        </div>

        <div className="custom-scroll flex-1 overflow-y-auto px-2 py-3">
          {ADMIN_GROUPS.map((group) => {
            const Icon = GROUP_ICON[group];
            return (
              <div key={group} className="mb-4">
                <div className="flex items-center gap-2 px-2 pb-1.5 text-[0.6875rem] font-medium tracking-wide text-zinc-500 uppercase">
                  <Icon />
                  {group}
                </div>
                <ul className="space-y-0.5">
                  {entriesInGroup(group).map((entry) => {
                    const href = `/admin/${entry.key}` as Route;
                    const active = pathname === href || pathname.startsWith(`${href}/`);

                    return (
                      <li key={entry.key}>
                        <Link
                          href={href}
                          onClick={() => setOpen(false)}
                          aria-current={active ? "page" : undefined}
                          /*
                            `admin-nav-item` draws the current marker from
                            `aria-current`, so the bar and the accessible state
                            cannot drift apart -- there is no second class to
                            remember. See styles/admin-motion.css.
                          */
                          className={cn(
                            "admin-nav-item flex items-center gap-2 rounded-md pl-3 pr-2 py-1.5 text-sm",
                            active
                              ? "bg-zinc-800/70 text-zinc-100"
                              : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200",
                          )}
                        >
                          {entry.labelPlural}
                          {entry.singleton && (
                            <span className="ml-auto text-[0.625rem] tracking-wide text-zinc-600 uppercase">
                              one
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="border-t border-zinc-800 px-4 py-3 text-xs text-zinc-500">
          {ADMIN_ENTRIES.length} screens
        </div>
      </nav>
    </>
  );
}
