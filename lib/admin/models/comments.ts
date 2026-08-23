import { sql } from "drizzle-orm";

import { lookup } from "@/lib/admin/sql";
import { username, userEmail } from "@/lib/admin/models/guestbook";
import { account, blogPost, comment, project } from "@/lib/db/app-schema";

import type { AdminFormModel } from "@/lib/admin/form";
import type { AdminListModel } from "@/lib/admin/list";

/** The comments changelist and form. */

const commentUser = username(comment.accountId);

/**
 * What a comment can be attached to: the two values `comment_target_kind_check`
 * allows, written once for the filter and the form rather than in both.
 */
const TARGET_KIND_CHOICES = [
  { value: "blog_post", label: "Blog post" },
  { value: "project", label: "Project" },
];

/**
 * What the comment is attached to, by name.
 *
 * Two correlated lookups and a coalesce, because `target_id` points at one of
 * two tables and `target_kind` says which. Doing it in SQL rather than by
 * joining both keeps the changelist one query, and either subquery returns
 * nothing for a row of the other kind, so the coalesce picks the one that
 * matched.
 *
 * The column used to print `blog_post #<uuid>`, which named the kind twice
 * over -- there is a Kind filter directly above it -- and then spent 36
 * characters saying nothing a person could act on.
 */
const commentTargetTitle = sql<string | null>`coalesce(${lookup<string>(
  blogPost.title,
  blogPost.id,
  comment.targetId,
)}, ${lookup<string>(project.title, project.id, comment.targetId)})`;

export type CommentRow = {
  id: string;
  user: string;
  targetKind: string;
  targetTitle: string | null;
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
    targetTitle: commentTargetTitle,
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
      // Sorted by the looked-up title rather than by the key behind it, so the
      // order is the one the column reads in.
      sort: commentTargetTitle,
      value: (row) => row.targetTitle ?? "— deleted —",
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
      choices: TARGET_KIND_CHOICES,
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
  /*
   * `target_id` carries no foreign key -- it points at a blog post or a project
   * depending on `target_kind`, and one column cannot reference two tables --
   * so nothing in the database would object to a pair that names neither. On
   * the create form both are chosen by hand, which is exactly where that pair
   * can be got wrong, so it is checked here.
   *
   * Only on create: both fields are fixed afterwards.
   */
  validate: async (values, { id, exists }) => {
    if (id !== null) return null;
    const kind = typeof values.targetKind === "string" ? values.targetKind : "";
    const target = typeof values.targetId === "string" ? values.targetId : "";
    if (!kind || !target) return null;

    const found =
      kind === "blog_post"
        ? await exists(blogPost, blogPost.id, target)
        : await exists(project, project.id, target);
    return found ? null : `That is not a ${kind === "blog_post" ? "blog post" : "project"}.`;
  },
  // Deleting here is a *hard* delete, distinct from the soft delete on the form
  // -- that is what the site's own button does, and what leaves a tombstone in
  // the thread.
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
      title: "Attached to",
      help: "Set when the comment is written, and fixed from then on.",
      fields: [
        {
          /*
           * Chosen when the comment is written and fixed from then on, for the
           * reason a guestbook message's author is: reassigning it puts what
           * somebody said somewhere they did not say it.
           *
           * All three are `NOT NULL` with no default, so a comment missing any
           * of them is not a row -- which is why they are on the form at all
           * rather than being left to a reader's own posting.
           */
          name: "user",
          column: comment.accountId,
          display: commentUser,
          label: "Posted by",
          kind: "reference",
          required: true,
          readOnly: "afterCreate",
          reference: { table: account, value: account.id, label: account.username },
        },
        {
          name: "targetKind",
          column: comment.targetKind,
          label: "Kind",
          kind: "select",
          required: true,
          readOnly: "afterCreate",
          // The column's own CHECK constraint, spelled out.
          choices: TARGET_KIND_CHOICES,
        },
        {
          /*
           * Two sources, because the column is polymorphic. The pair has to
           * agree with Kind above and nothing in the database will say so --
           * `validate` does, on the way in.
           */
          name: "targetId",
          column: comment.targetId,
          label: "On",
          kind: "reference",
          required: true,
          readOnly: "afterCreate",
          reference: [
            {
              table: blogPost,
              value: blogPost.id,
              label: blogPost.title,
              groupLabel: "Blog posts",
            },
            { table: project, value: project.id, label: project.title, groupLabel: "Projects" },
          ],
        },
      ],
    },
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
