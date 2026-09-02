/**
 * Three roles, and they nest.
 *
 *   public  ⊂  staff  ⊂  superuser
 *
 * **Public is not a column.** It is what every signed-in account has: post a
 * comment, post to the guestbook. Staff adds the admin and the moderation that
 * goes with it; superuser adds the rest. There is no fourth thing somebody can
 * hold on its own, which is the whole of the change this replaced.
 *
 * What it replaced was four roles over two tables answering one question at two
 * altitudes: `is_staff` and `is_superuser` on `account`, `is_author` and
 * `is_co_author` on `guest_profile`. The second pair was about the public site
 * -- guestbook credit, comment moderation, who gets emailed -- and the split
 * looked principled right up until the rows were read: the one author *was* the
 * one superuser and the two co-authors *were* two of the three staff. Two names
 * for one person, kept in step by hand, on separate tables with nothing tying
 * them.
 *
 * `account_superuser_is_staff` is what makes the nesting structural rather than
 * a convention: the database refuses a superuser who is not staff, so anything
 * true of staff is true of a superuser without a second condition anywhere.
 *
 * This module is the vocabulary -- what to call somebody, in the several places
 * that say it. `lib/auth/permissions.ts` decides what a role may do inside the
 * admin; `lib/auth/public.ts` decides what it may do outside. Pure and
 * client-safe on purpose: no `server-only`, no database, nothing carrying a
 * Drizzle column, because the rail is a client component and a constant
 * imported *from* one is not that constant on the server.
 */

/** Most privileged first, which is also the order anything listing them uses. */
export type SiteRole = "superuser" | "staff" | "public";

export const ROLE_LABEL: Record<SiteRole, string> = {
  superuser: "Superuser",
  staff: "Staff",
  public: "Public",
};

/**
 * A role in one sentence, for a `title`.
 *
 * A `title` rather than a hover card: `scripts/check-admin-nav.mjs` asserts
 * there is exactly one portaled `.admin-popover` on the page, and a tooltip
 * that portals itself to the body would make that two.
 */
export const ROLE_BLURB: Record<SiteRole, string> = {
  superuser:
    "Every admin screen and every action, and the only role that can grant access to others. Moderates the guestbook and the comments, and is the only one that can delete a message outright.",
  staff:
    "Reaches the admin -- what it opens inside is set per screen. Moderates comments and pins guestbook messages.",
  public:
    "A reader. Comments on posts and projects, and writes in the guestbook.",
};

export type RoleFlags = { isSuperuser: boolean; isStaff: boolean };

/**
 * The one role an account holds.
 *
 * One, not a list. The roles nest, so listing every role somebody satisfies
 * would put "Public" on every badge in the building and mark nobody out -- a
 * badge is only worth drawing where it distinguishes.
 */
export function roleFor(flags: RoleFlags): SiteRole {
  if (flags.isSuperuser) return "superuser";
  if (flags.isStaff) return "staff";
  return "public";
}

/**
 * The admin's own answer.
 *
 * Identical to `roleFor` in every case that can occur here: reaching the admin
 * at all means the account is at least staff, so "public" is unreachable and
 * this never returns it. Kept as its own name because the call sites read
 * better for it, and because the day something in the admin *can* be seen by a
 * reader, the two answers stop being the same.
 */
export function adminRole(isSuperuser: boolean): SiteRole {
  return isSuperuser ? "superuser" : "staff";
}
