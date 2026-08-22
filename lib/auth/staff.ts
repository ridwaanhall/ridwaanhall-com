import "server-only";

import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { cache } from "react";

import { auth } from "@/auth";
import { db } from "@/lib/db/client";
import { account } from "@/lib/db/app-schema";

/**
 * Who may use the admin.
 *
 * **The flag is read from the database on every request, never from the
 * session token.** This is the same rule `lib/auth/profile.ts` applies to
 * `is_author`/`is_co_author`, and it matters more here, not less: sessions are
 * thirty-day JWTs, so a token minted while someone was staff would keep
 * asserting it for a month after the flag was cleared. The token carries
 * identity (`token.sub` is `auth_user.id`); this carries permission.
 *
 * The test is `is_active AND is_staff`, which is exactly what Django's
 * `AdminSite.has_permission` checked. There is no `is_superuser` any more and
 * no permission matrix: the model dropped both in `drizzle/0005`, because the
 * database had zero `auth_group` rows, 152 permissions nothing consulted, and
 * every staff account flagged superuser -- a distinction that distinguished
 * nothing.
 */
export type StaffUser = {
  /** A uuid. */
  id: string;
  username: string;
  fullName: string;
  email: string;
};

/**
 * The signed-in staff user, or `null`.
 *
 * `null` covers three different situations on purpose -- nobody signed in, a
 * signed-in reader who is not staff, and a token whose `sub` no longer names a
 * row (a deleted account). The caller decides what to do about each; none of
 * them may see the admin.
 *
 * **Wrapped in `cache()`, so "read per request" does not mean "read per
 * caller".** Every admin screen asks twice -- the layout through `staffGate`
 * for the chrome, the page through `requireStaff` before it reads anything --
 * and the site's sidebar asks a third time for the admin link. React's
 * request-scoped memo collapses those into one query without weakening the
 * rule: the memo lives for one render pass, so the next request reads the flag
 * from the database again, which is the whole point of not carrying it in the
 * token.
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
  };
});

/**
 * Whether the request may act on admin data at all.
 *
 * Route handlers and server actions must call this themselves. A layout gate
 * does not cover them -- `app/admin/layout.tsx` runs for pages under its
 * segment and for nothing else, so an unprotected `POST /api/admin/...` would
 * be reachable by anyone who knows the path.
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
 * changelist for user 4, who is not staff, returned 72KB in which the visible
 * HTML said "Not permitted" while the Flight payload below it carried every
 * row, its title, its slug and its edit URL. Not rendered, but transmitted.
 *
 * So the layout keeps deciding what a rejected reader *sees*, and this decides
 * whether the work happens at all. Called as the first `await` in a page, it
 * throws before any query is issued, so there is no payload to leak.
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
 * The three outcomes the admin shell has to tell apart.
 *
 * Not being signed in and being signed in without the flag need different
 * screens: the first is fixed by signing in, and offering that to someone who
 * is *already* signed in is a loop. Django's admin ran them together on one
 * login page and answered the second with "You are authenticated as X, but are
 * not authorized to access this page"; these are the same two answers, on two
 * screens.
 *
 * `forbidden` states plainly that the admin exists. Nothing is given away by
 * that -- `robots.txt` already names `/admin/`, and the path was never the
 * secret; the session is.
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
