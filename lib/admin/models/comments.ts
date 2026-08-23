import { username, userEmail } from "@/lib/admin/models/guestbook";
import { comment } from "@/lib/db/app-schema";

import type { AdminFormModel } from "@/lib/admin/form";
import type { AdminListModel } from "@/lib/admin/list";

/** `CommentAdmin` in `apps/comments/admin.py`. */

const commentUser = username(comment.accountId);

/*
 * No lookup here: a comment names what it is attached to in two plain columns,
 * so "what is this a comment on" needs no second table.
 */

export type CommentRow = {
  id: string;
  user: string;
  targetKind: string;
  targetId: string;
  body: string;
  isDeleted: boolean;
  createdAt: string;
};

export const commentList: AdminListModel<CommentRow> = {
  key: "comment",
  from: comment,
  pk: comment.id,
  select: {
    id: comment.id,
    user: commentUser,
    targetKind: comment.targetKind,
    targetId: comment.targetId,
    body: comment.body,
    isDeleted: comment.isDeleted,
    createdAt: comment.createdAt,
  },
  columns: [
    // 70 characters, then an ellipsis if it was cut.
    {
      key: "body",
      label: "Comment",
      sort: comment.body,
      value: (row) => (row.body.length > 70 ? `${row.body.slice(0, 70)}…` : row.body),
    },
    { key: "user", label: "User", kind: "muted", sort: commentUser, value: (row) => row.user },
    {
      key: "target",
      label: "On",
      kind: "muted",
      // No sort: the value is two columns joined by a `#`, so there is nothing
      // single to order by.
      value: (row) => `${row.targetKind} #${row.targetId}`,
    },
    {
      key: "is_deleted",
      label: "Deleted",
      kind: "bool",
      sort: comment.isDeleted,
      value: (row) => row.isDeleted,
    },
    {
      key: "created_at",
      label: "Posted",
      kind: "datetime",
      sort: comment.createdAt,
      value: (row) => row.createdAt,
    },
  ],
  filters: [
    // Deleting is soft, so removed comments stay in the table with a blanked
    // body -- the tombstone the thread renders in their place. This filter is
    // the only way to see them apart from the rest.
    { key: "is_deleted", label: "Deleted", kind: "boolean", column: comment.isDeleted },
    {
      key: "target_kind",
      label: "On",
      kind: "choice",
      column: comment.targetKind,
      // Two values, fixed by the column's own CHECK constraint.
      choices: [
        { value: "blog_post", label: "Blog post" },
        { value: "project", label: "Project" },
      ],
    },
    { key: "created_at", label: "Posted", kind: "date", column: comment.createdAt },
  ],
  search: {
    fields: [
      comment.body,
      commentUser,
      userEmail(comment.accountId),
    ],
    placeholder: "Search comment, username or email",
  },
  // `ordering = ["created_at"]` on the model, which is thread order. A
  // changelist is not a thread, and the row worth seeing first is the newest.
  defaultSort: { key: "created_at", dir: "desc" },
  rowId: (row) => row.id,
};

export const commentForm: AdminFormModel = {
  key: "comment",
  from: comment,
  pk: comment.id,
  label: (values) => {
    const body = String(values.body ?? "");
    return body.length > 70 ? `${body.slice(0, 70)}…` : body || "Comment";
  },
  // Written by a reader on a post or a project; there is no comment the admin
  // authored. Deleting here is a *hard* delete, distinct from the soft delete
  // below -- that is what the site's own button does, and what leaves a
  // tombstone in the thread.
  canCreate: false,
  deleteWarning:
    "This removes the row outright, and its replies with it. To leave the thread intact, tick Deleted instead.",
  cascades: [
    {
      table: comment,
      fk: comment.replyToId,
      pk: comment.id,
      selfReference: true,
    },
  ],
  fieldsets: [
    {
      fields: [
        { name: "body", column: comment.body, label: "Comment", kind: "textarea", required: true },
        {
          name: "isDeleted",
          column: comment.isDeleted,
          label: "Deleted",
          kind: "checkbox",
          help: "A soft delete: the comment is replaced by a tombstone, its replies survive, and it stops being counted.",
        },
      ],
    },
    {
      title: "Recorded",
      fields: [
        {
          name: "user",
          column: comment.accountId,
          display: commentUser,
          label: "Posted by",
          kind: "text",
          readOnly: true,
        },
        {
          name: "createdAt",
          column: comment.createdAt,
          label: "Posted",
          kind: "datetime",
          readOnly: true,
        },
      ],
    },
  ],
};
