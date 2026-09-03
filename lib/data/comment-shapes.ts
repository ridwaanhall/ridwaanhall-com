/**
 * The comment section's shapes and rules -- everything with no database in it.
 *
 * Split from `comments.ts` for the same reason the guestbook's tree is: the
 * section is a client component and needs the length limit and the types, and a
 * *value* import from a module that touches `db` pulls `pg` into the browser
 * bundle. Types alone would be erased; a constant is what drags it in.
 */

import type { SiteRole } from "@/lib/auth/roles";

/**
 * The composer caps typing at this and `postComment` refuses a body over it.
 * The browser attribute is a courtesy; the action is the rule, since nothing
 * stops a request arriving without one.
 */
export const MAX_COMMENT_LENGTH = 1000;

/**
 * What may be commented on.
 *
 * An allowlist, and now also the value stored in `comment.target_kind`. The
 * kind arrives in the POST body, so without this a crafted request could
 * attach a comment to anything -- and the column's own CHECK constraint
 * refuses the same two values from the other side.
 */
export const COMMENTABLE = {
  blog_post: true,
  project: true,
} as const;

export type CommentTargetLabel = keyof typeof COMMENTABLE;

export function isCommentable(label: string): label is CommentTargetLabel {
  return Object.prototype.hasOwnProperty.call(COMMENTABLE, label);
}

export type CommentAuthor = {
  userId: string;
  /** The provider's display name, falling back to the username -- see `comments.ts`. */
  displayName: string;
  username: string;
  profileImage: string | null;
  /** Drawn as a badge beside the name, and `"public"` draws none. */
  role: SiteRole;
};

export type CommentNode = CommentAuthor & {
  id: string;
  body: string;
  isDeleted: boolean;
  createdAt: string;
  replies: CommentNode[];
  /** Whether the current viewer may delete it; decided on the server. */
  canDelete: boolean;
};

export type CommentSection = {
  comments: CommentNode[];
  /** Non-deleted comments and replies, which is what the heading counts. */
  count: number;
  targetLabel: CommentTargetLabel;
  targetId: string;
};

/**
 * Own comment, or anybody's when the viewer may moderate.
 *
 * A deleted comment is never deletable: the tombstone is the end state, and
 * offering the control again would suggest there is something left to remove.
 *
 * The viewer carries the *capability*, not the role behind it. Which role
 * moderates is `lib/auth/public.ts`'s answer and it has changed once already;
 * this rule has not, and should not have to.
 */
export function canDeleteComment(
  comment: { userId: string; isDeleted: boolean },
  viewer: { userId: string; moderate: boolean } | null,
): boolean {
  if (!viewer || comment.isDeleted) return false;
  if (comment.userId === viewer.userId) return true;
  return viewer.moderate;
}
