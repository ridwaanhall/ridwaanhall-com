import type { Metadata, Route } from "next";
import Link from "next/link";

import { AccessMatrix, type MatrixRow } from "@/components/admin/access-matrix";
import { BackIcon } from "@/components/admin/admin-icons";
import { NothingHere } from "@/components/admin/nothing-here";
import { accessAccountSelect } from "@/lib/admin/models/access";
import { formModelFor } from "@/lib/admin/models";
import { ADMIN_ENTRIES } from "@/lib/admin/registry";
import {
  grantableEntries,
  NO_GRANT,
  roleAllows,
  type AdminAction,
  type Grant,
} from "@/lib/auth/permissions";
import { requireSuperuser } from "@/lib/auth/staff";
import { db } from "@/lib/db/client";
import { account, adminAccess } from "@/lib/db/app-schema";
import { isUuid } from "@/lib/utils/uuid";
import { eq } from "drizzle-orm";

/**
 * One account's role and grants.
 *
 * The rows are the *registry*, not the stored grants: every grantable screen
 * appears whether or not this account has a row for it, because the question
 * the page asks is "what may this person do", and a screen missing from the
 * grid would be a question quietly not asked. A screen with no row reads as
 * four unticked boxes, which is exactly what it means.
 *
 * Two things the descriptors decide, resolved here so the client component
 * takes booleans and never a flag it might read wrongly:
 *
 *   * **`unavailable`** -- actions the model refuses to everybody. The three
 *     singletons have no add and no delete, `user` and `project-status` no add.
 *   * **`superuserOnly`** -- actions the model offers only to that role, which
 *     is to say the two `"superuser"` flags. They are not grantable, so they
 *     are not boxes.
 *
 * Both are read through `roleAllows`, which is the only thing permitted to look
 * at `canCreate`/`canDelete`: they are `boolean | "superuser"`, and a truthy
 * string tested with `!== false` reads as *allowed*.
 */
export async function generateMetadata({
  params,
}: PageProps<"/admin/access/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) return { title: "Access · Admin" };

  const [row] = await db
    .select({ username: account.username })
    .from(account)
    .where(eq(account.id, id))
    .limit(1);
  return { title: row ? `${row.username} · Access · Admin` : "Access · Admin" };
}

/** Never prerendered, like every other admin route: the session comes first. */
export const instant = false;

export default async function AdminAccessRecordPage({
  params,
}: PageProps<"/admin/access/[id]">) {
  // First, and before the id is even parsed. Superuser rather than staff: this
  // is the screen that hands out permissions.
  await requireSuperuser();

  const { id } = await params;
  const listHref = "/admin/access" as Route;

  // A key that is not a uuid is not "no such row": Postgres raises `22P02` on
  // it and the page answers 500 where the honest answer is not-found.
  if (!isUuid(id)) return <Missing listHref={listHref} />;

  const [target] = await db
    .select(accessAccountSelect)
    .from(account)
    .where(eq(account.id, id))
    .limit(1);
  if (!target) return <Missing listHref={listHref} />;

  const stored = await db
    .select({
      key: adminAccess.modelKey,
      view: adminAccess.canView,
      add: adminAccess.canAdd,
      change: adminAccess.canChange,
      delete: adminAccess.canDelete,
    })
    .from(adminAccess)
    .where(eq(adminAccess.accountId, id));

  const byKey = new Map<string, Grant>(
    stored.map((row) => [
      row.key,
      { view: row.view, add: row.add, change: row.change, delete: row.delete },
    ]),
  );

  const rows: MatrixRow[] = grantableEntries(ADMIN_ENTRIES).map((entry) => {
    const form = formModelFor(entry.key);
    const unavailable: AdminAction[] = [];
    const superuserOnly: AdminAction[] = [];

    for (const [act, flag] of [
      ["add", form?.canCreate],
      ["delete", form?.canDelete],
    ] as const) {
      // A screen with no form descriptor cannot be written through at all, so
      // both of its write actions are unavailable rather than merely ungranted.
      if (!form) unavailable.push(act as AdminAction);
      else if (flag === "superuser") superuserOnly.push(act as AdminAction);
      else if (!roleAllows(flag, false)) unavailable.push(act as AdminAction);
    }

    // A singleton is one row that is never added to and never removed, whatever
    // its descriptor happens to say -- `/admin/<key>` *is* that record's form.
    if (entry.singleton) {
      for (const act of ["add", "delete"] as AdminAction[]) {
        if (!unavailable.includes(act)) unavailable.push(act);
      }
    }

    // `change` on a screen with no form is not offered either: there is a
    // record page for it, and nothing to write through.
    if (!form && !unavailable.includes("change")) unavailable.push("change");

    return {
      key: entry.key,
      label: entry.labelPlural,
      group: entry.group,
      unavailable,
      superuserOnly: superuserOnly.filter((act) => !unavailable.includes(act)),
      grant: byKey.get(entry.key) ?? NO_GRANT,
    };
  });

  const fullName = `${target.firstName} ${target.lastName}`.trim();
  const actor = await requireSuperuser();

  return (
    <div className="admin-fade space-y-5">
      <Link
        href={listHref}
        className="inline-flex items-center gap-1.5 rounded text-xs text-zinc-500 transition-colors hover:text-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
      >
        <BackIcon height={14} width={14} />
        Access
      </Link>

      <div>
        <h1 className="text-xl font-medium text-zinc-100">{target.username}</h1>
        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          {fullName || target.email || "Account"}
          <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-xs break-all text-zinc-500">
            {target.id}
          </code>
        </p>
        {/*
          An account without the staff flag cannot reach the admin whatever is
          granted here, and the flag is edited on Users. Saying so is the
          difference between a matrix that appears not to work and one that
          tells you which other screen to visit.
        */}
        {!target.isStaff && (
          <p className="mt-3 rounded-md border border-amber-900/60 bg-amber-500/5 px-3 py-2 text-sm text-amber-500/90">
            This account is not staff, so it cannot open the admin at all. The
            grants below are kept and take effect when the staff flag is set,
            which is done on the Users screen.
          </p>
        )}
        {!target.isActive && (
          <p className="mt-2 rounded-md border border-amber-900/60 bg-amber-500/5 px-3 py-2 text-sm text-amber-500/90">
            This account is inactive, so it cannot sign in. Also set on Users.
          </p>
        )}
      </div>

      <AccessMatrix
        accountId={target.id}
        username={target.username}
        isSelf={target.id === actor.id}
        initialSuperuser={target.isSuperuser}
        rows={rows}
        listHref={listHref}
      />
    </div>
  );
}

/**
 * Rendered rather than thrown.
 *
 * `notFound()` here would answer under an HTTP 200 anyway -- the status is
 * committed as soon as the route is known to be dynamic, and reading the
 * session is what makes it so -- and the admin's own "Nothing here" is the
 * better of the two screens.
 */
function Missing({ listHref }: { listHref: Route }) {
  return (
    <NothingHere
      message="There is no account with that id. It may have been deleted."
      backLabel="Access"
      backHref={listHref}
    />
  );
}
