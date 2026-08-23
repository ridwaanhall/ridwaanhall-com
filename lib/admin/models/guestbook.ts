import type { PgColumn } from "drizzle-orm/pg-core";

import { MAX_MESSAGE_LENGTH } from "@/lib/data/guestbook-tree";
import { account, guestMessage, guestProfile } from "@/lib/db/app-schema";

import { lookup } from "@/lib/admin/sql";

import type { AdminFormModel } from "@/lib/admin/form";
import type { AdminListModel } from "@/lib/admin/list";

/**
 * The two `guestbook` changelists.
 *
 * Both identify a person by `account.username`, not by their display name. The
 * guestbook itself shows the provider's display name out of the stored profile
 * (see `lib/auth/profile.ts`), which is whatever someone has set it to this
 * week and is not unique. An admin list has to be able to tell two people
 * apart, so it uses the stable, unique thing.
 */
export const username = (fk: PgColumn) => lookup<string>(account.username, account.id, fk);

/** The account's email, for the search box. */
export const userEmail = (fk: PgColumn) => lookup<string>(account.email, account.id, fk);

/** The first N characters, with no ellipsis -- the column is already clipped. */
function preview(message: string, limit: number): string {
  return message.slice(0, limit);
}

// --- ChatMessage -------------------------------------------------------------

export type ChatMessageRow = {
  id: string;
  user: string;
  message: string;
  timestamp: string;
  isPinned: boolean;
};

const messageUser = username(guestMessage.accountId);

export const chatMessageList: AdminListModel<ChatMessageRow> = {
  key: "chat-message",
  from: guestMessage,
  pk: guestMessage.id,
  select: {
    id: guestMessage.id,
    user: messageUser,
    message: guestMessage.body,
    timestamp: guestMessage.postedAt,
    isPinned: guestMessage.isPinned,
  },
  columns: [
    // The message leads, not the author: the first column is what links to the
    // record, and a column of repeated usernames is a poor thing to click.
    // Both are still shown.
    {
      key: "message",
      label: "Message",
      sort: guestMessage.body,
      value: (row) => preview(row.message, 50),
    },
    { key: "user", label: "User", kind: "muted", sort: messageUser, value: (row) => row.user },
    {
      key: "timestamp",
      label: "Posted",
      kind: "datetime",
      sort: guestMessage.postedAt,
      value: (row) => row.timestamp,
    },
    {
      key: "is_pinned",
      label: "Pinned",
      kind: "bool",
      sort: guestMessage.isPinned,
      value: (row) => row.isPinned,
    },
  ],
  filters: [{ key: "is_pinned", label: "Pinned", kind: "boolean", column: guestMessage.isPinned }],
  search: {
    fields: [guestMessage.body, messageUser],
    placeholder: "Search message or username",
  },
  // `ordering = ['-timestamp']` on the model.
  defaultSort: { key: "timestamp", dir: "desc" },
  rowId: (row) => row.id,
};

// --- UserProfile -------------------------------------------------------------

export type UserProfileRow = {
  id: string;
  user: string;
  isAuthor: boolean;
  isCoAuthor: boolean;
  coAuthorOrder: number;
};

const profileUser = username(guestProfile.accountId);

export const userProfileList: AdminListModel<UserProfileRow> = {
  key: "user-profile",
  from: guestProfile,
  pk: guestProfile.id,
  select: {
    id: guestProfile.id,
    user: profileUser,
    isAuthor: guestProfile.isAuthor,
    isCoAuthor: guestProfile.isCoAuthor,
    coAuthorOrder: guestProfile.coAuthorOrder,
  },
  columns: [
    { key: "user", label: "User", sort: profileUser, value: (row) => row.user },
    {
      key: "is_author",
      label: "Author",
      kind: "bool",
      sort: guestProfile.isAuthor,
      value: (row) => row.isAuthor,
    },
    {
      key: "is_co_author",
      label: "Co-author",
      kind: "bool",
      sort: guestProfile.isCoAuthor,
      value: (row) => row.isCoAuthor,
    },
    {
      key: "co_author_order",
      label: "Order",
      kind: "number",
      sort: guestProfile.coAuthorOrder,
      value: (row) => row.coAuthorOrder,
    },
  ],
  filters: [
    { key: "is_author", label: "Author", kind: "boolean", column: guestProfile.isAuthor },
    { key: "is_co_author", label: "Co-author", kind: "boolean", column: guestProfile.isCoAuthor },
  ],
  search: {
    // Username and email both live on the account, so both are subqueries
    // against the same related row.
    fields: [profileUser, userEmail(guestProfile.accountId)],
    placeholder: "Search username or email",
  },
  defaultSort: { key: "user", dir: "asc" },
  rowId: (row) => row.id,
};

export const chatMessageForm: AdminFormModel = {
  key: "chat-message",
  from: guestMessage,
  pk: guestMessage.id,
  label: (values) => preview(String(values.message ?? ""), 50) || "Message",
  deleteWarning: "Replies to this message go with it -- the whole branch is removed.",
  cascades: [
    {
      table: guestMessage,
      fk: guestMessage.replyToId,
      pk: guestMessage.id,
      selfReference: true,
    },
  ],
  fieldsets: [
    {
      title: "Moderation",
      help: "Editing changes what a reader sees over its author's name. Use it to redact, not to rewrite.",
      fields: [
        {
          name: "message",
          column: guestMessage.body,
          label: "Message",
          kind: "textarea",
          required: true,
          maxLength: MAX_MESSAGE_LENGTH,
        },
      ],
    },
    {
      title: "Recorded",
      fields: [
        {
          /*
           * Chosen when the message is written and fixed from then on.
           *
           * Not editable afterwards, because reassigning it would move what
           * somebody said onto another person's name -- which is the same
           * reason the Moderation note above says to redact rather than
           * rewrite. On the create form it is a real choice, and it has to be:
           * `account_id` is `NOT NULL` with no default, so a message with no
           * author is not a row.
           */
          name: "user",
          column: guestMessage.accountId,
          display: messageUser,
          label: "Posted by",
          kind: "reference",
          required: true,
          readOnly: "afterCreate",
          reference: { table: account, value: account.id, label: account.username },
          help: "Whose name this appears under in the guestbook. It cannot be changed later.",
        },
        {
          name: "timestamp",
          column: guestMessage.postedAt,
          label: "Posted",
          kind: "datetime",
          readOnly: true,
        },
        {
          /*
           * Read-only on purpose, and not an omission.
           *
           * Pinning is not a boolean write. `pinMessage` in
           * `lib/actions/guestbook.ts` caps the pinned set at MAX_PINNED under a
           * deterministic row lock -- two requests could otherwise both read a
           * count under the limit and both save -- and it stamps `pinned_at`,
           * which is what the pinned cards are ordered by. A generic form that
           * set the flag alone would quietly break that ordering and skip the
           * cap, so the toggle stays in the one place that implements it.
           */
          name: "isPinned",
          column: guestMessage.isPinned,
          label: "Pinned",
          kind: "checkbox",
          readOnly: true,
          help: "Pin and unpin from the guestbook itself, where the limit and the ordering are handled.",
        },
      ],
    },
  ],
};

export const userProfileForm: AdminFormModel = {
  key: "user-profile",
  from: guestProfile,
  pk: guestProfile.id,
  label: (values) => String(values.user ?? "Profile"),
  /*
   * One profile per account, enforced by `guest_profile_account_key`.
   *
   * A profile is normally written for an account the first time it is seen, so
   * adding one by hand is a repair rather than routine -- for an account that
   * somehow has none, or one whose profile was removed. The uniqueness is
   * checked below rather than left to the constraint: Postgres names the
   * constraint and not the column when it raises, and
   * `guest_profile_account_key` does not contain the string `account_id`, so
   * the substring match in `uniqueField` would not find the field to hang the
   * message on and the clash would surface as an untranslated error.
   */
  validate: async (values, { id, exists }) => {
    if (id !== null) return null;
    const accountId = typeof values.user === "string" ? values.user : "";
    if (!accountId) return null;
    return (await exists(guestProfile, guestProfile.accountId, accountId))
      ? "That account already has a profile. Open the existing one instead."
      : null;
  },
  deleteWarning:
    "The author and co-author flags go with it. The account and its messages are untouched.",
  fieldsets: [
    {
      fields: [
        {
          // Which account this profile belongs to, and only at the moment it is
          // made: moving one to another account would hand that person the
          // author badge and the right to delete anybody's message.
          name: "user",
          column: guestProfile.accountId,
          display: profileUser,
          label: "Account",
          kind: "reference",
          required: true,
          readOnly: "afterCreate",
          reference: { table: account, value: account.id, label: account.username },
        },
        {
          name: "isAuthor",
          column: guestProfile.isAuthor,
          label: "Author",
          kind: "checkbox",
          help: "Carries the Author badge, and may pin and delete any message.",
        },
        {
          name: "isCoAuthor",
          column: guestProfile.isCoAuthor,
          label: "Co-author",
          kind: "checkbox",
          help: "The same permissions, with the Co-Author badge.",
        },
        {
          name: "coAuthorOrder",
          column: guestProfile.coAuthorOrder,
          label: "Co-author order",
          kind: "number",
          min: 0,
          help: "Only meaningful for a co-author.",
        },
      ],
    },
  ],
};
