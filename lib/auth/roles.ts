/**
 * What to call somebody, in the four places that say it.
 *
 * The admin topbar, the admin rail, and the public site's account row all
 * answer the same question -- what is this person here -- and answering it in
 * three files is how they come to disagree about whether the word is
 * "Superuser", "Admin" or "Owner". The vocabulary is here instead, and the
 * components render it.
 *
 * Pure and client-safe on purpose: no `server-only`, no database, and nothing
 * carrying a Drizzle column. The rail is a client component, so a role has to
 * survive being passed as a prop -- and a constant imported *from* a client
 * module is not that constant on the server (`lib/admin/rail.ts` is the one
 * that cost), so a plain module both sides import is the shape that works.
 *
 * The flags themselves are still read from the database on every request. None
 * of them is carried in the session token, and nothing here changes that: this
 * turns booleans somebody already fetched into words.
 */

/**
 * Ordered most privileged first, which is also the order they are drawn in.
 *
 * The first two are about this admin and come from `account`; the second two
 * are about the public site and come from `guest_profile`. They are genuinely
 * different questions -- an author is somebody whose guestbook messages are
 * credited and whose comments are theirs to moderate, which has nothing to do
 * with reaching a changelist -- so an account can hold one, both, or neither.
 */
export type SiteRole = "superuser" | "staff" | "author" | "co-author";

export const ROLE_LABEL: Record<SiteRole, string> = {
  superuser: "Superuser",
  staff: "Staff",
  author: "Author",
  "co-author": "Co-author",
};

/**
 * What a role is, in one sentence, for a `title`.
 *
 * A `title` rather than a hover card: `scripts/check-admin-nav.mjs` asserts
 * there is exactly one portaled `.admin-popover` on the page, and a tooltip
 * that portals itself to the body would make that two.
 */
export const ROLE_BLURB: Record<SiteRole, string> = {
  superuser: "Every screen and every action, and the only role that can grant access to others.",
  staff: "Reaches this admin. What it opens inside is set per screen on the Access screen.",
  author: "Guestbook messages are credited to this account, and comments are theirs to moderate.",
  "co-author": "Credited on the guestbook alongside the author.",
};

export type RoleFlags = {
  isSuperuser: boolean;
  isStaff: boolean;
  isAuthor: boolean;
  isCoAuthor: boolean;
};

/**
 * Every role somebody holds, most privileged first.
 *
 * **Superuser instead of staff, never both.** Every superuser is staff -- the
 * database says so -- so listing the two together would put a badge on every
 * account that carries the other one and mark nobody out. The badge is only
 * worth drawing where it distinguishes.
 */
export function rolesFor(flags: RoleFlags): SiteRole[] {
  const roles: SiteRole[] = [];
  if (flags.isSuperuser) roles.push("superuser");
  else if (flags.isStaff) roles.push("staff");
  if (flags.isAuthor) roles.push("author");
  else if (flags.isCoAuthor) roles.push("co-author");
  return roles;
}

/** The admin's own answer: inside it, staff is the floor rather than a role. */
export function adminRole(isSuperuser: boolean): SiteRole {
  return isSuperuser ? "superuser" : "staff";
}
