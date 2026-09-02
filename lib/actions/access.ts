"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { grantableEntries, withImpliedView, type Grant } from "@/lib/auth/permissions";
import { getStaffUser } from "@/lib/auth/staff";
import { ADMIN_ENTRIES } from "@/lib/admin/registry";
import { db } from "@/lib/db/client";
import { account, adminAccess } from "@/lib/db/app-schema";
import { isUuid } from "@/lib/utils/uuid";

/**
 * Writing one account's role and grants.
 *
 * Its own module rather than a case in `lib/actions/admin.ts`, because it
 * shares nothing with `saveRecord`: there is no form descriptor, no column
 * mapping, no inline, no image. What it writes is a matrix over the *registry*,
 * and the registry is the only thing that says which rows are legitimate.
 *
 * **The gate is here, not only on the page that renders the form.** A server
 * action is a POST endpoint with a generated id; it does not inherit the page's
 * `requireSuperuser()` any more than it inherits the layout's screen. This is
 * the action that hands out permissions, so it is the last one that may assume
 * anything about who is calling it.
 */

export type AccessResult = { ok: true; notice: string } | { ok: false; error: string };

/**
 * The screens a matrix may carry, resolved once.
 *
 * Anything not in here is ignored on the way in rather than rejected, and that
 * is deliberate: the form posts a fixed set of names, so a name that is not one
 * of them did not come from the form. Rejecting would turn a stale open tab
 * after a screen is renamed into an error somebody has to decode; ignoring
 * leaves the grant for a screen that no longer exists simply unwritten.
 */
const GRANTABLE = grantableEntries(ADMIN_ENTRIES);
const GRANTABLE_KEYS = new Set(GRANTABLE.map((entry) => entry.key));

/**
 * Read one screen's four checkboxes out of the post.
 *
 * A checkbox that is not ticked is not submitted at all -- that is how HTML
 * works, and it is why this reads the names it expects rather than iterating
 * what arrived. The same rule `parseFormValues` follows for records: a writable
 * set that comes from the request is not a set.
 */
function readGrant(data: FormData, key: string): Grant {
  const on = (action: string) => data.get(`${key}.${action}`) === "on";
  // View is implied by the other three on the way in as well as on the way
  // out, so a tab that lost its JavaScript cannot store a grant that opens
  // nothing -- see `withImpliedView`.
  return withImpliedView({
    view: on("view"),
    add: on("add"),
    change: on("change"),
    delete: on("delete"),
  });
}

/**
 * Save the superuser flag and the whole grant matrix for one account.
 *
 * The matrix is written as a whole rather than as a diff. Every screen is on
 * the form, so what arrives *is* the intended state: a diff would have to
 * decide what an absent key means, and the answer would have to be "unchanged",
 * which makes unticking the last box in a row indistinguishable from a field
 * that failed to post.
 *
 * Rows are kept when every flag is false rather than deleted. A stored row of
 * four falses and no row at all mean the same thing to `can`, and keeping it
 * means the matrix's next save is an update rather than an insert -- but more
 * usefully, it means the screens count on the list is a count of `can_view`
 * rather than of rows, and says the truth either way.
 */
export async function saveAccess(
  accountId: string,
  _previous: AccessResult | null,
  data: FormData,
): Promise<AccessResult> {
  const actor = await getStaffUser();
  if (!actor?.isSuperuser) return { ok: false, error: "You are not permitted to do that." };

  // From the URL, so it is input. A non-uuid against a uuid column raises
  // `22P02` and throws out of the action rather than returning a result.
  if (!isUuid(accountId)) return { ok: false, error: "That account no longer exists." };

  const [target] = await db
    .select({ id: account.id, isStaff: account.isStaff, isSuperuser: account.isSuperuser })
    .from(account)
    .where(eq(account.id, accountId))
    .limit(1);
  if (!target) return { ok: false, error: "That account no longer exists." };

  const isSuperuser = data.get("isSuperuser") === "on";

  /*
   * You cannot take your own power away.
   *
   * The same rule the user form states for `is_staff` and `is_active`, and it
   * matters more here: clearing your own superuser flag on the one screen that
   * can set it leaves nobody able to set it back except through SQL. Written
   * again rather than shared, because the two forms write two tables and what
   * they have in common is the sentence, not the code.
   */
  if (accountId === actor.id && !isSuperuser) {
    return { ok: false, error: "You cannot remove your own superuser access." };
  }

  /*
   * A superuser's grants are not read by anything -- `can` answers on the role
   * before it looks at the map -- so the matrix is disabled on the form and its
   * checkboxes do not post. Writing whatever did arrive would silently blank
   * the rows that are waiting there for the day the role is taken away again.
   */
  if (isSuperuser) {
    await db.update(account).set({ isSuperuser: true }).where(eq(account.id, accountId));
    revalidatePath("/admin/access");
    revalidatePath(`/admin/access/${accountId}`);
    return { ok: true, notice: "Saved. This account has full access." };
  }

  const grants = new Map(GRANTABLE.map((entry) => [entry.key, readGrant(data, entry.key)]));

  await db.transaction(async (tx) => {
    await tx.update(account).set({ isSuperuser: false }).where(eq(account.id, accountId));

    /*
     * Replace the rows this matrix owns, and only those. A row naming a screen
     * that is no longer in the registry is left where it is: `can` refuses it
     * already, and deleting it here would quietly discard the grants of a
     * screen somebody is part-way through renaming.
     */
    const existing = await tx
      .select({ key: adminAccess.modelKey })
      .from(adminAccess)
      .where(
        and(
          eq(adminAccess.accountId, accountId),
          inArray(adminAccess.modelKey, [...GRANTABLE_KEYS]),
        ),
      );
    const stored = new Set(existing.map((row) => row.key));

    for (const [key, grant] of grants) {
      const row = {
        canView: grant.view,
        canAdd: grant.add,
        canChange: grant.change,
        canDelete: grant.delete,
      };
      if (stored.has(key)) {
        await tx
          .update(adminAccess)
          .set(row)
          .where(and(eq(adminAccess.accountId, accountId), eq(adminAccess.modelKey, key)));
      } else {
        await tx.insert(adminAccess).values({ accountId, modelKey: key, ...row });
      }
    }
  });

  /*
   * The rail, the index and every changelist this account sees are built from
   * these rows, and they are read per request rather than cached -- so there is
   * no tag to expire. What does need saying is that the two access screens
   * themselves have changed, since the list's "Screens" count is derived.
   */
  revalidatePath("/admin/access");
  revalidatePath(`/admin/access/${accountId}`);

  const granted = [...grants.values()].filter((grant) => grant.view).length;
  return {
    ok: true,
    notice:
      granted === 0
        ? "Saved. This account can sign in, but cannot open any screen."
        : `Saved. ${granted} ${granted === 1 ? "screen" : "screens"} granted.`,
  };
}
