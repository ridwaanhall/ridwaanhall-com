import type { Metadata } from "next";

import { ChangelistScreen } from "@/components/admin/changelist-screen";
import { accessList } from "@/lib/admin/models/access";
import { ADMIN_ENTRIES_BY_KEY } from "@/lib/admin/registry";
import { requireSuperuser } from "@/lib/auth/staff";

/**
 * Who can reach this admin, and how much of it.
 *
 * **A static segment, so it wins over `[model]`.** Next resolves a literal path
 * segment before a dynamic one, which is what lets this screen exist beside
 * thirty-four generated ones without a special case in the router. The registry
 * still carries an entry for it -- the rail and the index page are built from
 * the registry and nothing else -- marked `custom` so the checks expect a route
 * here rather than a descriptor pair.
 *
 * **In its own route group.** `(index)` is not in the URL and is not
 * decoration: a `loading.tsx` beside a page is also the fallback for every
 * *child* slot of that segment, so a `loading.tsx` sitting directly under
 * `access/` would draw this list on the way to `access/<id>`'s matrix. The
 * group is a router segment, so the skeleton moves below the slot its sibling
 * arrives in and the parent slot is left with no loading data at all.
 *
 * The list itself is the ordinary `Changelist`, from an ordinary descriptor:
 * search, sort, filters and paging come free, and the screen looks like every
 * other list here because it *is* one. What it does not have is a form -- see
 * `lib/admin/models/access.ts`.
 */
export const metadata: Metadata = {
  title: "Access · Admin",
};

/**
 * Never prerendered, like every other admin route: the first thing this page
 * does is read the session, so there is no shell to build ahead of the request.
 */
export const instant = false;

export default async function AdminAccessPage({
  searchParams,
}: PageProps<"/admin/access">) {
  /*
   * Superuser, not staff, and this is the whole gate for the screen.
   *
   * It is refused as not-found rather than as "not permitted", the same way a
   * screen without a grant is: somebody staff enough to be reading this is
   * already inside, and the thing they must not be handed is confirmation that
   * a screen exists which hands out the permissions they do not have.
   *
   * `superuserOnly` on the registry entry is what keeps the row out of the
   * rail, out of the index and out of the matrix. This is what keeps the URL
   * shut, which is the half that matters: the other three are presentation.
   */
  await requireSuperuser();

  const entry = ADMIN_ENTRIES_BY_KEY.get("access")!;

  return (
    <div className="admin-fade space-y-4">
      <div>
        <h1 className="text-xl font-medium text-zinc-100">{entry.labelPlural}</h1>
        <p className="mt-1 text-sm text-zinc-400">{entry.blurb}</p>
      </div>

      <ChangelistScreen entry={entry} model={accessList} searchParams={searchParams} />
    </div>
  );
}
