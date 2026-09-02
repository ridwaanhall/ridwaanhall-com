import type { Route } from "next";
import Link from "next/link";

import {
  ArticleIcon,
  BriefcaseIcon,
  ChatIcon,
  ChevronIcon,
  KeyIcon,
  CommentIcon,
  CubeIcon,
  PersonIcon,
  ScaleIcon,
  SlidersIcon,
  UsersIcon,
} from "@/components/admin/admin-icons";
import { ADMIN_GROUPS, navItemsInGroup, type AdminGroup } from "@/lib/admin/registry";
import { permittedKeys } from "@/lib/auth/permissions";
import { requireStaff } from "@/lib/auth/staff";

/**
 * The admin index: every screen, grouped as the sidebar groups them.
 *
 * A Settings section is one card standing in for its tabs, exactly as it is one
 * row in the rail. The card names them underneath, so collapsing seventeen
 * vocabularies into six pages hides none of them from somebody scanning for one.
 *
 * It shows what *this account* may open, which is not the same as what the
 * admin holds. A card leading to a screen that answers not-found is worse than
 * no card, and a card that names a screen somebody is being kept out of hands
 * them a map of the place instead of an explanation.
 *
 * The counts under each heading follow, so the page never claims an area holds
 * more than it lists.
 *
 * The group icons are the rail's, from one table. Somebody arriving here and
 * then using the rail is looking at the same nine marks in the same nine
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
  Access: KeyIcon,
  Settings: SlidersIcon,
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
  const actor = await requireStaff();
  const permitted = new Set(permittedKeys(actor));

  const groups = ADMIN_GROUPS.map((group) => ({
    group,
    items: navItemsInGroup(group, permitted),
  })).filter(({ items }) => items.length > 0);

  const screens = groups.reduce((total, { items }) => total + items.length, 0);

  return (
    <div className="admin-fade space-y-9">
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-2xl font-medium text-zinc-100">Admin</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-zinc-400">
          Content for ridwaanhall.com, read from and written to the live database.
        </p>
        <p className="mt-3 text-xs text-zinc-600">
          {screens} {screens === 1 ? "screen" : "screens"} across {groups.length}{" "}
          {groups.length === 1 ? "area" : "areas"}
        </p>
      </div>

      {/*
        A staff account with no grants yet is a real state, not a fault: the
        account is in, and nobody has said what it may do. Saying that plainly
        is the difference between "your access has not been set up" and a page
        that looks broken -- and it names who to ask, since the reader cannot
        see the Access screen to find out.
      */}
      {groups.length === 0 && (
        <p className="max-w-2xl rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 text-sm text-zinc-400">
          This account can sign in to the admin, but has not been given access to
          any screen yet. A superuser sets that on the Access screen.
        </p>
      )}

      {groups.map(({ group, items }) => {
        const Icon = GROUP_ICON[group];

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
              <span className="text-xs text-zinc-600 tabular-nums">{items.length}</span>
              {/* A rule that starts where the heading ends, so eight sections
                  read as one column rather than eight separate boxes. */}
              <span aria-hidden="true" className="ml-1 h-px flex-1 bg-zinc-800" />
            </div>

            <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href as Route}
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
                        {item.label}
                      </span>
                      {item.singleton && (
                        <span className="shrink-0 rounded-full border border-zinc-800 px-1.5 py-0.5 text-[0.625rem] tracking-wide text-zinc-500 uppercase">
                          single row
                        </span>
                      )}
                      <ChevronIcon
                        aria-hidden="true"
                        className="ml-auto shrink-0 text-zinc-700 transition-colors group-hover:text-indigo-400"
                      />
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{item.blurb}</p>
                    {/*
                      A section's tabs, named. The rail lists the section rather
                      than its tabs now, so this is the only place a vocabulary is
                      written out at all -- without it Settings offers six names
                      for seventeen screens, and somebody looking for work modes
                      has nowhere left to find the word.

                      It wraps, and nothing caps it. Job preferences joins six
                      labels into 117 characters, and the narrowest box this
                      paragraph gets is 289px -- three columns at exactly 1280,
                      which is narrower than the single column at 390. Clipping
                      to one line showed two of the six names there; capping at
                      two still cut the last one, measured. Any cap is a number
                      that holds until somebody adds a tab, and a cap that cuts a
                      name is this paragraph failing at the one thing it is for.
                      The cards stretch to their row, so a taller one costs only
                      the row's height.
                    */}
                    {item.tabs && (
                      <p className="mt-2 text-[0.6875rem] text-zinc-600">
                        {item.tabs.map((tab) => tab.labelPlural).join(" · ")}
                      </p>
                    )}
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
