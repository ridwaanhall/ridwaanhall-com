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
 * An allowlist, not a lookup. `content_type` arrives in the POST body, so
 * without this a crafted request could attach comments to any model in the
 * project -- and the ids are Django's own `django_content_type` rows, which the
 * cutover keeps precisely because `comments_comment.content_type_id` is a live
 * foreign key to them.
 */
export const COMMENTABLE = {
  "blog.blogpost": true,
  "projects.project": true,
} as const;

export type CommentTargetLabel = keyof typeof COMMENTABLE;

export function isCommentable(label: string): label is CommentTargetLabel {
  return Object.prototype.hasOwnProperty.call(COMMENTABLE, label);
}

export type CommentAuthor = {
  userId: number;
  /** Django's `get_full_name|default:username` -- see the note in `comments.ts`. */
  displayName: string;
  username: string;
  profileImage: string | null;
  isAuthor: boolean;
  isCoAuthor: boolean;
};

export type CommentNode = CommentAuthor & {
  id: number;
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
  targetId: number;
};

/**
 * Own comment, or any comment when the viewer is an author or co-author.
 *
 * A deleted comment is never deletable: the tombstone is the end state, and
 * offering the control again would suggest there is something left to remove.
 */
export function canDeleteComment(
  comment: { userId: number; isDeleted: boolean },
  viewer: { userId: number; isAuthor: boolean; isCoAuthor: boolean } | null,
): boolean {
  if (!viewer || comment.isDeleted) return false;
  if (comment.userId === viewer.userId) return true;
  return viewer.isAuthor || viewer.isCoAuthor;
}
