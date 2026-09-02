import "server-only";

import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { cache } from "react";

import { auth } from "@/auth";
import {
  can,
  permits,
  type AdminAction,
  type AdminActor,
  type Grants,
} from "@/lib/auth/permissions";
import { db } from "@/lib/db/client";
import { account, adminAccess } from "@/lib/db/app-schema";

/**
 * Who may use the admin, and what they may do in it.
 *
 * **Nothing here is read from the session token.** The flags and the grants
 * both come from the database on every request. That is the same rule
 * `lib/auth/profile.ts` applies to `is_author`/`is_co_author`, and it matters
 * more with a matrix than it did with one boolean: sessions are thirty-day
 * JWTs, so a token minted while somebody was staff would keep asserting it for
 * a month after the flag was cleared -- and a token carrying a *grant set*
 * would keep asserting delete on every screen for just as long, with nothing
 * the superuser could do about it but wait. The token carries identity
 * (`token.sub` is the account id); this carries permission.
 *
 * Three roles, and they are not degrees of one thing:
 *
 *   * `is_active` -- may sign in at all. Cleared, nothing else applies.
 *   * `is_staff` -- may reach the admin. What they reach *inside* it is the
 *     grant rows, one per screen.
 *   * `is_superuser` -- answers yes to every screen and every action, and is
 *     the only role that may edit anyone's grants.
 *
 * `guest_profile.is_author` and `is_co_author` are deliberately not here. They
 * are about the public site -- guestbook credit, comment moderation, who gets
 * emailed -- and answer a different question from what somebody may do in this
 * admin.
 */
export type StaffUser = AdminActor;

/**
 * The signed-in staff user, or `null`.
 *
 * `null` covers three different situations on purpose -- nobody signed in, a
 * signed-in reader who is not staff, and a token whose `sub` no longer names a
 * row (a deleted account). The caller decides what to do about each; none of
 * them may see the admin.
 *
 * **Wrapped in `cache()`, so "read per request" does not mean "read per
 * caller".** Every admin screen asks at least twice -- the layout through
 * `staffGate` for the chrome, the page through `requireStaff` before it reads
 * anything -- and the site's sidebar asks again for the admin link. React's
 * request-scoped memo collapses those into one pair of queries without
 * weakening the rule: the memo lives for one render pass, so the next request
 * reads the flags and the grants from the database again, which is the whole
 * point of not carrying them in the token.
 *
 * The grants are fetched **only for a staff account that passed the flags**.
 * A signed-in reader who is not staff is refused before the second query, so
 * the common case -- every public page, which asks this for the admin link --
 * costs exactly what it did before this table existed.
 */
export const getStaffUser = cache(async function getStaffUser(): Promise<StaffUser | null> {
  const session = await auth();
  // A uuid now, not an integer. The old guard parsed the subject as a number
  // and rejected anything that was not one -- which every account id is today.
  const id = session?.user?.id;
  if (!id) return null;

  const [user] = await db
    .select({
      id: account.id,
      username: account.username,
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      isStaff: account.isStaff,
      isSuperuser: account.isSuperuser,
      isActive: account.isActive,
    })
    .from(account)
    .where(eq(account.id, id))
    .limit(1);

  if (!user || !user.isActive || !user.isStaff) return null;

  return {
    id: user.id,
    username: user.username,
    fullName: `${user.firstName} ${user.lastName}`.trim() || user.username,
    email: user.email,
    isSuperuser: user.isSuperuser,
    // A superuser's answers do not come from rows, so its rows are not read.
    // `can` short-circuits on the role before it looks at the map, and a
    // superuser with a stale half-filled grant set must not read as narrower
    // than the role says.
    grants: user.isSuperuser ? {} : await grantsFor(user.id),
  };
});

/**
 * One account's grants, keyed by registry key.
 *
 * One query for the whole set rather than one per question: a single admin page
 * asks about a dozen screens -- the rail alone asks about every one of them --
 * and a query per ask would be a round trip to Supabase per row of the sidebar.
 *
 * A row naming a screen that no longer exists is loaded here and refused by
 * `can`, rather than filtered out here. The registry is what decides that, and
 * putting the decision in one place is what keeps a renamed screen from
 * silently inheriting the old one's permissions.
 */
async function grantsFor(accountId: string): Promise<Grants> {
  const rows = await db
    .select({
      key: adminAccess.modelKey,
      view: adminAccess.canView,
      add: adminAccess.canAdd,
      change: adminAccess.canChange,
      delete: adminAccess.canDelete,
    })
    .from(adminAccess)
    .where(eq(adminAccess.accountId, accountId));

  const grants: Grants = {};
  for (const row of rows) {
    grants[row.key] = {
      view: row.view,
      add: row.add,
      change: row.change,
      delete: row.delete,
    };
  }
  return grants;
}

/**
 * Whether the request may act on admin data at all.
 *
 * Route handlers and server actions must call this themselves. A layout gate
 * does not cover them -- `app/admin/layout.tsx` runs for pages under its
 * segment and for nothing else, so an unprotected `POST /api/admin/...` would
 * be reachable by anyone who knows the path.
 *
 * It answers the *staff* question only. Anything that reads or writes one
 * model's rows must go on to ask `permits`, which is what `lib/actions/admin.ts`
 * does.
 */
export async function isStaffRequest(): Promise<boolean> {
  return (await getStaffUser()) !== null;
}

/**
 * The gate every admin **page** must call, before it reads anything.
 *
 * **A layout gate is not enough, and this was measured rather than assumed.**
 * `app/admin/layout.tsx` returns a "Not permitted" screen instead of
 * `{children}` for a non-staff reader -- and the page underneath still ran.
 * React renders a layout and its children concurrently, so the layout choosing
 * not to display the page does not stop the page executing: fetching a
 * changelist for a reader who is not staff returned 72KB in which the visible
 * HTML said "Not permitted" while the Flight payload below it carried every
 * row, its title, its slug and its edit URL. Not rendered, but transmitted.
 *
 * So the layout keeps deciding what a rejected reader *sees*, and this decides
 * whether the work happens at all. Called as the first `await` in a page, it
 * throws before any query is issued, so there is no payload to leak.
 *
 * The same reasoning now applies one level down, which is why
 * `requirePermission` exists: the layout cannot know which screen a page is
 * about, so a staff account without `view` on a model would otherwise be sent
 * a rail that omits the screen and a payload that carries all of its rows.
 *
 * `notFound()` rather than a redirect: a redirect from a page that a layout is
 * already answering produces two different responses for one request, and the
 * layout's screen is the better of them. The 404 is never what the reader ends
 * up seeing -- it is discarded along with the rest of the page's output.
 */
export async function requireStaff(): Promise<StaffUser> {
  const user = await getStaffUser();
  if (!user) notFound();
  return user;
}

/**
 * The gate a **model's** page must call, immediately after `requireStaff` and
 * before `params` becomes a query.
 *
 * Refusing with `notFound()` rather than a "not permitted" screen is
 * deliberate, and it is the opposite choice from the one the layout makes for a
 * non-staff reader. That reader is told the admin exists, because `robots.txt`
 * already names `/admin/` and the path was never the secret. This reader is
 * staff and is already inside; what they must not learn is *which screens they
 * are being kept out of* -- a "you may not open Users" is a map of the admin
 * drawn for somebody who was not given one.
 */
export async function requirePermission(key: string, action: AdminAction): Promise<StaffUser> {
  const user = await requireStaff();
  if (!can(user, key, action)) notFound();
  return user;
}

/**
 * The same, for an action a model descriptor can also refuse.
 *
 * `add` and `delete` are the two, and a grant may not widen either -- see
 * `permits`. The model is passed in rather than looked up here so this module
 * stays clear of `lib/admin/models/`, which imports half the schema.
 */
export async function requireModelPermission(
  key: string,
  action: AdminAction,
  model: { canCreate?: boolean | "superuser"; canDelete?: boolean | "superuser" } | null,
): Promise<StaffUser> {
  const user = await requireStaff();
  if (!permits(user, key, action, model)) notFound();
  return user;
}

/** The screen that hands out grants, and the only role that reaches it. */
export async function requireSuperuser(): Promise<StaffUser> {
  const user = await requireStaff();
  if (!user.isSuperuser) notFound();
  return user;
}

/**
 * The three outcomes the admin shell has to tell apart.
 *
 * Not being signed in and being signed in without the flag need different
 * screens: the first is fixed by signing in, and offering that to someone who
 * is *already* signed in is a loop. Two answers, on two screens.
 *
 * `forbidden` states plainly that the admin exists. Nothing is given away by
 * that -- `robots.txt` already names `/admin/`, and the path was never the
 * secret; the session is.
 *
 * A staff account whose grants are all empty is **not** a fourth outcome. It is
 * `ok`, and it gets the admin with an empty rail and an index page that says
 * so. Turning it into a rejection here would make "your superuser has not
 * finished setting you up" indistinguishable from "you are not staff", which
 * are two very different things to be told.
 */
export type StaffGate =
  | { status: "ok"; user: StaffUser }
  | { status: "anonymous" }
  | { status: "forbidden"; username: string };

export async function staffGate(): Promise<StaffGate> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return { status: "anonymous" };

  const user = await getStaffUser();
  if (user) return { status: "ok", user };

  // A signed-in reader without the flag -- or a token whose `sub` no longer
  // names a row, which reads the same way and is equally not admissible.
  return { status: "forbidden", username: session?.user?.name ?? "this account" };
}
