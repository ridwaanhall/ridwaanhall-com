import type { PgColumn } from "drizzle-orm/pg-core";

import { MAX_MESSAGE_LENGTH } from "@/lib/data/guestbook-tree";
import { account, guestMessage } from "@/lib/db/app-schema";

import { lookup } from "@/lib/admin/sql";

import type { AdminFormModel } from "@/lib/admin/form";
import type { AdminListModel } from "@/lib/admin/list";

/**
 * The guestbook's changelist.
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
