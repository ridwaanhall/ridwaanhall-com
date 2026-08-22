import type { Route } from "next";
import Link from "next/link";

import { ChevronIcon } from "@/components/admin/admin-icons";
import { ADMIN_GROUPS, entriesInGroup } from "@/lib/admin/registry";
import { requireStaff } from "@/lib/auth/staff";

/**
 * The admin index: every model, grouped as the sidebar groups them.
 *
 * Django's index listed only what the signed-in user could reach, from the
 * permission matrix. There is no matrix to port -- the live database has zero
 * `auth_group` rows and every staff account is a superuser -- so this lists
 * everything, and the only distinction drawn is whether the screen is built.
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
  await requireStaff();

  return (
    <div className="admin-fade space-y-8">
      <div>
        <h1 className="text-xl font-medium text-zinc-100">Admin</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Content for ridwaanhall.com, read from and written to the live database.
        </p>
      </div>

      {ADMIN_GROUPS.map((group) => (
        <section key={group}>
          <h2 className="mb-2 text-xs font-medium tracking-wide text-zinc-500 uppercase">{group}</h2>
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {entriesInGroup(group).map((entry) => {
              const body = (
                <>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        entry.ready ? "text-sm font-medium text-zinc-200" : "text-sm font-medium text-zinc-500"
                      }
                    >
                      {entry.labelPlural}
                    </span>
                    {entry.singleton && (
                      <span className="rounded-full border border-zinc-800 px-1.5 py-0.5 text-[0.625rem] tracking-wide text-zinc-500 uppercase">
                        single row
                      </span>
                    )}
                    {entry.ready ? (
                      <ChevronIcon className="ml-auto text-zinc-600" />
                    ) : (
                      <span className="ml-auto text-[0.625rem] tracking-wide text-zinc-600 uppercase">
                        soon
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{entry.blurb}</p>
                </>
              );

              return (
                <li key={entry.key}>
                  {entry.ready ? (
                    <Link
                      href={`/admin/${entry.key}` as Route}
                      className="block rounded-lg border border-zinc-800 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900/60"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="block cursor-not-allowed rounded-lg border border-zinc-900 p-3">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
