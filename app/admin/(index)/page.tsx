import type { Route } from "next";
import Link from "next/link";

import { SECTION_TITLE } from "@/components/admin/control-classes";
import { ScreenHead } from "@/components/admin/screen-head";
import { Icon } from "@/components/foothill/icons";
import { ADMIN_GROUPS, navItemsInGroup } from "@/lib/admin/registry";
import { hasAnyAccess, permittedKeys } from "@/lib/auth/permissions";
import { requireStaff } from "@/lib/auth/staff";

/**
 * The admin index: every screen, grouped as the sidebar groups them.
 *
 * A Settings section is one row standing in for its tabs, exactly as it is one
 * row in the rail. The row names them underneath, so collapsing seventeen
 * vocabularies into six pages hides none of them from somebody scanning for one.
 *
 * It shows what *this account* may open, which is not the same as what the
 * admin holds. A row leading to a screen that answers not-found is worse than
 * no row, and a row that names a screen somebody is being kept out of hands
 * them a map of the place instead of an explanation.
 *
 * The counts beside each heading follow, so the page never claims an area
 * holds more than it lists.
 */

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
    <div className="admin-fade space-y-14">
      <ScreenHead
        title="Admin"
        lead="Content for ridwaanhall.com, read from and written to the live database."
        meta={`${screens} ${screens === 1 ? "screen" : "screens"} across ${groups.length} ${groups.length === 1 ? "area" : "areas"}`}
      />

      {/*
        A staff account with no grants yet is a real state, not a fault: the
        account is in, and nobody has said what it may do. Saying that plainly
        is the difference between "your access has not been set up" and a page
        that looks broken -- and it names who to ask, since the reader cannot
        see the Access screen to find out.
      */}
      {!hasAnyAccess(actor) && (
        <p className="max-w-2xl text-[15px] leading-relaxed text-zinc-400">
          This account can sign in to the admin, but has not been given access to
          any screen yet. A superuser sets that on the Access screen.
        </p>
      )}

      {/*
        Each area as the public site sets a section: its name in the display
        face with the count beside it, and the screens under it as ruled rows
        rather than cards -- the hairlines carry the structure a box would.
      */}
      {groups.map(({ group, items }) => (
        <section key={group} aria-labelledby={`area-${group}`} className="grid gap-5 lg:grid-cols-12 lg:gap-10">
          <h2 id={`area-${group}`} className={`${SECTION_TITLE} flex items-start gap-1.5 lg:col-span-3`}>
            {group}
            <span className="mt-0.5 font-sans text-[11px] font-normal tracking-normal text-zinc-500 tabular-nums">
              {items.length}
            </span>
          </h2>

          <ul className="grid gap-x-10 border-t border-zinc-800 sm:grid-cols-2 lg:col-span-9">
            {items.map((item) => (
              <li key={item.href} className="border-b border-zinc-800">
                <Link
                  href={item.href as Route}
                  className="group flex h-full items-start gap-4 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="text-[15px] font-medium text-zinc-100">{item.label}</span>
                      {item.singleton && <span className="text-[12px] text-zinc-500">Single row</span>}
                    </span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-zinc-500">{item.blurb}</span>
                    {/*
                      A section's tabs, named. The rail lists the section rather
                      than its tabs, so this is the only place a vocabulary is
                      written out at all -- without it Settings offers six names
                      for seventeen screens, and somebody looking for work modes
                      has nowhere left to find the word. It wraps and nothing
                      caps it: any cap is a number that holds until somebody
                      adds a tab, and a cap that cuts a name fails at the one
                      thing this line is for.
                    */}
                    {item.tabs && (
                      <span className="mt-1.5 block text-[12px] text-zinc-600">
                        {item.tabs.map((tab) => tab.labelPlural).join(", ")}
                      </span>
                    )}
                  </span>
                  <Icon
                    name="arrow-right"
                    className="mt-1 h-4 w-4 text-zinc-600 transition-[color,transform] duration-300 group-hover:translate-x-0.5 group-hover:text-zinc-100"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
