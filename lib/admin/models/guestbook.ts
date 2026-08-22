import type { PgColumn } from "drizzle-orm/pg-core";

import { MAX_MESSAGE_LENGTH } from "@/lib/data/guestbook-tree";
import { authUser, guestbookChatmessage, guestbookUserprofile } from "@/lib/db/schema";

import { lookup } from "@/lib/admin/sql";

import type { AdminFormModel } from "@/lib/admin/form";
import type { AdminListModel } from "@/lib/admin/list";

/**
 * The two `guestbook` changelists, from `apps/guestbook/admin.py`.
 *
 * Both display a user, and `auth_user.username` is what Django's `__str__`
 * resolved to -- not the display name. That distinction is deliberate here as
 * well: the guestbook itself shows the provider's display name out of
 * `socialaccount.extra_data` (see `lib/auth/profile.ts`), which is whatever
 * someone has set it to this week and is not unique. The admin identifies rows
 * by the stable, unique thing.
 */
export const username = (fk: PgColumn) => lookup<string>(authUser.username, authUser.id, fk);

/** The account's email, which Django searched as `user__email`. */
export const userEmail = (fk: PgColumn) => lookup<string>(authUser.email, authUser.id, fk);

/** Django's `message_preview` -- the first 50 characters, no ellipsis. */
function preview(message: string, limit: number): string {
  return message.slice(0, limit);
}

// --- ChatMessage -------------------------------------------------------------

export type ChatMessageRow = {
  id: number;
  user: string;
  message: string;
  timestamp: string;
  isPinned: boolean;
};

const messageUser = username(guestbookChatmessage.userId);

export const chatMessageList: AdminListModel<ChatMessageRow> = {
  key: "chat-message",
  from: guestbookChatmessage,
  pk: guestbookChatmessage.id,
  select: {
    id: guestbookChatmessage.id,
    user: messageUser,
    message: guestbookChatmessage.message,
    timestamp: guestbookChatmessage.timestamp,
    isPinned: guestbookChatmessage.isPinned,
  },
  columns: [
    // Django led with the user; the message leads here, because that is what
    // the first column links from and a column of repeated usernames is a poor
    // thing to click. Both are still shown.
    {
      key: "message",
      label: "Message",
      sort: guestbookChatmessage.message,
      value: (row) => preview(row.message, 50),
    },
    { key: "user", label: "User", kind: "muted", sort: messageUser, value: (row) => row.user },
    {
      key: "timestamp",
      label: "Posted",
      kind: "datetime",
      sort: guestbookChatmessage.timestamp,
      value: (row) => row.timestamp,
    },
    {
      key: "is_pinned",
      label: "Pinned",
      kind: "bool",
      sort: guestbookChatmessage.isPinned,
      value: (row) => row.isPinned,
    },
  ],
  filters: [{ key: "is_pinned", label: "Pinned", kind: "boolean", column: guestbookChatmessage.isPinned }],
  search: {
    fields: [guestbookChatmessage.message, messageUser],
    placeholder: "Search message or username",
  },
  // `ordering = ['-timestamp']` on the model.
  defaultSort: { key: "timestamp", dir: "desc" },
  rowId: (row) => row.id,
};

// --- UserProfile -------------------------------------------------------------

export type UserProfileRow = {
  id: number;
  user: string;
  isAuthor: boolean;
  isCoAuthor: boolean;
  coAuthorOrder: number;
};

const profileUser = username(guestbookUserprofile.userId);

export const userProfileList: AdminListModel<UserProfileRow> = {
  key: "user-profile",
  from: guestbookUserprofile,
  pk: guestbookUserprofile.id,
  select: {
    id: guestbookUserprofile.id,
    user: profileUser,
    isAuthor: guestbookUserprofile.isAuthor,
    isCoAuthor: guestbookUserprofile.isCoAuthor,
    coAuthorOrder: guestbookUserprofile.coAuthorOrder,
  },
  columns: [
    { key: "user", label: "User", sort: profileUser, value: (row) => row.user },
    {
      key: "is_author",
      label: "Author",
      kind: "bool",
      sort: guestbookUserprofile.isAuthor,
      value: (row) => row.isAuthor,
    },
    {
      key: "is_co_author",
      label: "Co-author",
      kind: "bool",
      sort: guestbookUserprofile.isCoAuthor,
      value: (row) => row.isCoAuthor,
    },
    {
      key: "co_author_order",
      label: "Order",
      kind: "number",
      sort: guestbookUserprofile.coAuthorOrder,
      value: (row) => row.coAuthorOrder,
    },
  ],
  filters: [
    { key: "is_author", label: "Author", kind: "boolean", column: guestbookUserprofile.isAuthor },
    { key: "is_co_author", label: "Co-author", kind: "boolean", column: guestbookUserprofile.isCoAuthor },
  ],
  search: {
    // Django searched `user__username` and `user__email`; both are on the same
    // related row, so both are subqueries against it.
    fields: [profileUser, userEmail(guestbookUserprofile.userId)],
    placeholder: "Search username or email",
  },
  defaultSort: { key: "user", dir: "asc" },
  rowId: (row) => row.id,
};

export const chatMessageForm: AdminFormModel = {
  key: "chat-message",
  from: guestbookChatmessage,
  pk: guestbookChatmessage.id,
  label: (values) => preview(String(values.message ?? ""), 50) || "Message",
  // A message is written by a reader in the guestbook. There is no such thing as
  // one the site owner posted from the admin, and inventing one would put words
  // on the page over somebody else's name.
  canCreate: false,
  deleteWarning: "Replies to this message go with it -- the whole branch is removed.",
  cascades: [
    {
      table: guestbookChatmessage,
      fk: guestbookChatmessage.replyToId,
      pk: guestbookChatmessage.id,
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
          column: guestbookChatmessage.message,
          label: "Message",
          kind: "textarea",
          required: true,
          maxLength: MAX_MESSAGE_LENGTH,
        },
      ],
    },
    {
      title: "Recorded",
      help: "Set when the message was posted, and not editable here.",
      fields: [
        {
          name: "user",
          column: guestbookChatmessage.userId,
          display: messageUser,
          label: "Posted by",
          kind: "text",
          readOnly: true,
        },
        {
          name: "timestamp",
          column: guestbookChatmessage.timestamp,
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
          column: guestbookChatmessage.isPinned,
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
  from: guestbookUserprofile,
  pk: guestbookUserprofile.id,
  label: (values) => String(values.user ?? "Profile"),
  // Created by a `post_save` signal on the account and paired with it one to
  // one, so there is nothing to add and removing one would leave a signed-in
  // reader with no profile at all.
  canCreate: false,
  canDelete: false,
  fieldsets: [
    {
      fields: [
        {
          name: "user",
          column: guestbookUserprofile.userId,
          display: profileUser,
          label: "Account",
          kind: "text",
          readOnly: true,
        },
        {
          name: "isAuthor",
          column: guestbookUserprofile.isAuthor,
          label: "Author",
          kind: "checkbox",
          help: "Carries the Author badge, and may pin and delete any message.",
        },
        {
          name: "isCoAuthor",
          column: guestbookUserprofile.isCoAuthor,
          label: "Co-author",
          kind: "checkbox",
          help: "The same permissions, with the Co-Author badge.",
        },
        {
          name: "coAuthorOrder",
          column: guestbookUserprofile.coAuthorOrder,
          label: "Co-author order",
          kind: "number",
          min: 0,
          help: "Only meaningful for a co-author.",
        },
      ],
    },
  ],
};
