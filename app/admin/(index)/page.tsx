import type { Route } from "next";
import Link from "next/link";

import {
  ArticleIcon,
  BriefcaseIcon,
  ChatIcon,
  ChevronIcon,
  CommentIcon,
  CubeIcon,
  PersonIcon,
  ScaleIcon,
  UsersIcon,
} from "@/components/admin/admin-icons";
import { ADMIN_ENTRIES, ADMIN_GROUPS, entriesInGroup, type AdminGroup } from "@/lib/admin/registry";
import { requireStaff } from "@/lib/auth/staff";

/**
 * The admin index: every model, grouped as the sidebar groups them.
 *
 * There is one privilege here, `is_staff`, so there is no per-model permission
 * matrix to reflect: anyone who can see this page can reach everything on it.
 *
 * The group icons are the rail's, from one table. Somebody arriving here and
 * then using the rail is looking at the same eight marks in the same eight
 * places, which is the whole of what makes an index and a nav feel like one
 * thing rather than two lists that happen to agree.
 */
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
 * Never prerendered, for the same reason as the layout and the changelist
 * beside it: the first thing this page does is read the session, so there is no
 * shell to build ahead of the request. The layout carrying `instant = false`
 * does not cover the pages under it -- each route decides for itself, and this
 * one was the only admin route without the line.
 */
export const instant = false;

export default async function AdminIndexPage() {
  // No data of its own, but it still describes the shape of the admin, and a
  // non-staff reader has no business receiving that either.
  await requireStaff();

  return (
    <div className="admin-fade space-y-9">
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-2xl font-medium text-zinc-100">Admin</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-zinc-400">
          Content for ridwaanhall.com, read from and written to the live database.
        </p>
        <p className="mt-3 text-xs text-zinc-600">
          {ADMIN_ENTRIES.length} screens across {ADMIN_GROUPS.length} areas
        </p>
      </div>

      {ADMIN_GROUPS.map((group) => {
        const Icon = GROUP_ICON[group];
        const entries = entriesInGroup(group);

        return (
          <section key={group}>
            <div className="mb-3 flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400"
              >
                <Icon height={15} width={15} />
              </span>
              <h2 className="text-sm font-medium text-zinc-300">{group}</h2>
              <span className="text-xs text-zinc-600 tabular-nums">{entries.length}</span>
              {/* A rule that starts where the heading ends, so eight sections
                  read as one column rather than eight separate boxes. */}
              <span aria-hidden="true" className="ml-1 h-px flex-1 bg-zinc-800" />
            </div>

            <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {entries.map((entry) => (
                <li key={entry.key}>
                  <Link
                    href={`/admin/${entry.key}` as Route}
                    /*
                      Border and background only. This site has no shadows
                      anywhere, so a card that lifted on hover would be the one
                      surface in the admin announcing it came from somewhere
                      else.
                    */
                    className="admin-card group block h-full rounded-lg border border-zinc-800 bg-zinc-950/40 p-3.5 hover:border-zinc-700 hover:bg-zinc-900/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-zinc-200">
                        {entry.labelPlural}
                      </span>
                      {entry.singleton && (
                        <span className="shrink-0 rounded-full border border-zinc-800 px-1.5 py-0.5 text-[0.625rem] tracking-wide text-zinc-500 uppercase">
                          single row
                        </span>
                      )}
                      <ChevronIcon
                        aria-hidden="true"
                        className="ml-auto shrink-0 text-zinc-700 transition-colors group-hover:text-indigo-400"
                      />
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{entry.blurb}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
