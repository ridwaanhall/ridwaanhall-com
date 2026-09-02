/**
 * What an account may do on the *public* site.
 *
 * The twin of `lib/auth/permissions.ts`, which answers the same kind of
 * question about the admin, and pure for the same reasons: no database, no
 * `server-only`, so the actions, the read paths, the check harnesses and the
 * unit suite all ask one implementation.
 *
 * **Before this there was nothing to ask.** Posting a comment or a guestbook
 * message was gated on "is there a session", full stop -- no per-account
 * permission, no rate limiting, no way to stop one person short of deleting
 * their account and taking every comment they had ever written with it. The
 * only public permissions that existed were `is_author` and `is_co_author`,
 * and those were about moderating other people rather than about posting.
 *
 * **`is_active` gates every one of these**, and that is a fix rather than a
 * feature. It is documented in three places as "may sign in at all" and was
 * read in exactly one -- `getStaffUser` -- so it meant "may reach the admin"
 * and nothing else. A deactivated account could still sign in, still comment,
 * still post, still pin. It cannot now.
 *
 * Deliberately *not* extended to sign-in itself. Refusing the session would
 * mean an Auth.js `signIn` callback, which is a different blast radius --
 * everything downstream of a refused sign-in is a redirect somebody has to be
 * able to read -- and the switch exists to stop the writing, not the reading.
 */

import { roleFor, type SiteRole } from "@/lib/auth/roles";

/** The stored flags, from `account` and `public_access`. */
export type PublicFlags = {
  isActive: boolean;
  isStaff: boolean;
  isSuperuser: boolean;
  canComment: boolean;
  canGuestbook: boolean;
};

/**
 * What those flags mean, as the five questions the public site actually asks.
 *
 * Named for the act rather than for the role, so a caller cannot accidentally
 * reason about the role instead -- `if (viewer.isStaff)` in an action is how
 * two rules about the same thing drift apart.
 */
export type PublicCapabilities = {
  /** Post a comment on a blog post or a project. */
  comment: boolean;
  /** Post a message in the guestbook, or a reply. */
  guestbook: boolean;
  /** Delete somebody else's comment. Deleting your own needs no permission. */
  moderateComments: boolean;
  /** Pin and unpin a guestbook message. */
  pin: boolean;
  /**
   * Delete a guestbook message outright, and its whole branch with it.
   *
   * Superuser rather than staff, and that asymmetry is inherited rather than
   * invented: deleting a message was author-only while pinning and comment
   * moderation were author-or-co-author. A guestbook delete is a recursive hard
   * delete with no tombstone, so it is the one public act nothing can undo.
   */
  deleteMessages: boolean;
};

export const NO_PUBLIC_ACCESS: PublicCapabilities = {
  comment: false,
  guestbook: false,
  moderateComments: false,
  pin: false,
  deleteMessages: false,
};

export function publicCapabilities(flags: PublicFlags): PublicCapabilities {
  // Inactive answers no to everything, before the role is consulted at all --
  // an inactive superuser is still an account that must not write.
  if (!flags.isActive) return NO_PUBLIC_ACCESS;

  return {
    comment: flags.canComment,
    guestbook: flags.canGuestbook,
    // Staff covers superuser: `account_superuser_is_staff` makes the nesting
    // structural, so neither of these needs to name the higher role as well.
    moderateComments: flags.isStaff,
    pin: flags.isStaff,
    deleteMessages: flags.isSuperuser,
  };
}

/** The role those same flags describe. Re-exported so callers need one import. */
export function publicRole(flags: Pick<PublicFlags, "isStaff" | "isSuperuser">): SiteRole {
  return roleFor(flags);
}
