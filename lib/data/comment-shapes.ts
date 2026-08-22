/**
 * The comment section's shapes and rules -- everything with no database in it.
 *
 * Split from `comments.ts` for the same reason the guestbook's tree is: the
 * section is a client component and needs the length limit and the types, and a
 * *value* import from a module that touches `db` pulls `pg` into the browser
 * bundle. Types alone would be erased; a constant is what drags it in.
 */

/** `models.TextField(max_length=MAX_COMMENT_LENGTH)`. */
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
  /** A uuid; see drizzle/0005. */
  userId: string;
  /** Django's `get_full_name|default:username` -- see the note in `comments.ts`. */
  displayName: string;
  username: string;
  profileImage: string | null;
  isAuthor: boolean;
  isCoAuthor: boolean;
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
 * Own comment, or any comment when the viewer is an author or co-author.
 *
 * A deleted comment is never deletable: the tombstone is the end state, and
 * offering the control again would suggest there is something left to remove.
 */
export function canDeleteComment(
  comment: { userId: string; isDeleted: boolean },
  viewer: { userId: string; isAuthor: boolean; isCoAuthor: boolean } | null,
): boolean {
  if (!viewer || comment.isDeleted) return false;
  if (comment.userId === viewer.userId) return true;
  return viewer.isAuthor || viewer.isCoAuthor;
}
