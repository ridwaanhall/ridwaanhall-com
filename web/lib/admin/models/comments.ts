import { username, userEmail } from "@/lib/admin/models/guestbook";
import { lookup } from "@/lib/admin/sql";
import { commentsComment, djangoContentType } from "@/lib/db/schema";

import type { AdminListModel } from "@/lib/admin/list";

/** `CommentAdmin` in `apps/comments/admin.py`. */

const commentUser = username(commentsComment.userId);

/**
 * The model name behind the generic foreign key -- "blogpost" or "project".
 *
 * `comments_comment.content_type_id` is a live FK into `django_content_type`,
 * and that table survives the cutover for exactly this reason: it is what says
 * which kind of thing a comment is attached to.
 */
const targetModel = lookup<string>(
  djangoContentType.model,
  djangoContentType.id,
  commentsComment.contentTypeId,
);

export type CommentRow = {
  id: number;
  user: string;
  targetModel: string;
  objectId: number;
  body: string;
  isDeleted: boolean;
  createdAt: string;
};

export const commentList: AdminListModel<CommentRow> = {
  key: "comment",
  from: commentsComment,
  pk: commentsComment.id,
  select: {
    id: commentsComment.id,
    user: commentUser,
    targetModel,
    objectId: commentsComment.objectId,
    body: commentsComment.body,
    isDeleted: commentsComment.isDeleted,
    createdAt: commentsComment.createdAt,
  },
  columns: [
    // Django's `short_body`: 70 characters, then an ellipsis if it was cut.
    {
      key: "body",
      label: "Comment",
      sort: commentsComment.body,
      value: (row) => (row.body.length > 70 ? `${row.body.slice(0, 70)}…` : row.body),
    },
    { key: "user", label: "User", kind: "muted", sort: commentUser, value: (row) => row.user },
    {
      key: "target",
      label: "On",
      kind: "muted",
      // Django's `target_label`, and it did not sort either: the value is two
      // columns joined by a `#`, so there is nothing single to order by.
      value: (row) => `${row.targetModel} #${row.objectId}`,
    },
    {
      key: "is_deleted",
      label: "Deleted",
      kind: "bool",
      sort: commentsComment.isDeleted,
      value: (row) => row.isDeleted,
    },
    {
      key: "created_at",
      label: "Posted",
      kind: "datetime",
      sort: commentsComment.createdAt,
      value: (row) => row.createdAt,
    },
  ],
  filters: [
    // Deleting is soft, so removed comments stay in the table with a blanked
    // body -- the tombstone the thread renders in their place. This filter is
    // the only way to see them apart from the rest.
    { key: "is_deleted", label: "Deleted", kind: "boolean", column: commentsComment.isDeleted },
    {
      key: "content_type",
      label: "On",
      kind: "choice",
      column: commentsComment.contentTypeId,
      choices: { table: djangoContentType, value: djangoContentType.id, label: djangoContentType.model },
    },
    { key: "created_at", label: "Posted", kind: "date", column: commentsComment.createdAt },
  ],
  search: {
    fields: [
      commentsComment.body,
      commentUser,
      userEmail(commentsComment.userId),
    ],
    placeholder: "Search comment, username or email",
  },
  // `ordering = ["created_at"]` on the model, which is thread order. A
  // changelist is not a thread, and the row worth seeing first is the newest.
  defaultSort: { key: "created_at", dir: "desc" },
  rowId: (row) => row.id,
};
