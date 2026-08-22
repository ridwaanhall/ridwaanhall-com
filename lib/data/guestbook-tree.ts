/**
 * The guestbook's shapes, limits and threading -- everything with no database
 * in it.
 *
 * Split from `guestbook.ts` because the panel is a client component and needs
 * the limits and the types. Importing them from the query module pulled `db`,
 * and therefore `pg`, into the browser bundle, which fails outright on
 * `Module not found: Can't resolve 'dns'`. Types alone would have been erased;
 * it is the two exported constants that dragged the rest in.
 *
 * It also mirrors the original's own split: `apps/guestbook/tree.py` was a pure
 * module that issued no queries, precisely so threading could be reasoned about
 * and tested on plain dicts.
 */

/** Root plus two nested levels; see `buildThread`. */
export const MAX_DEPTH = 3;

/** What the panel can usefully scroll through, matching `MESSAGE_WINDOW`. */
export const MESSAGE_WINDOW = 50;

/** `ChatMessage.MAX_PINNED_MESSAGES`. */
export const MAX_PINNED = 3;

/** `models.TextField(max_length=500)`, and the form's `maxlength`. */
export const MAX_MESSAGE_LENGTH = 500;
export const MIN_MESSAGE_LENGTH = 2;

export type MessageAuthor = {
  /** A uuid; see drizzle/0005. */
  userId: string;
  fullName: string;
  profileImage: string | null;
  isAuthor: boolean;
  isCoAuthor: boolean;
  coAuthorOrder: number;
  /** Masked; see `maskEmail`. */
  email: string;
};

export type ReplyTarget = MessageAuthor & { id: string; message: string };

export type ThreadMessage = MessageAuthor & {
  id: string;
  message: string;
  timestamp: string;
  isPinned: boolean;
  replyTo: ReplyTarget | null;
  /** Filled by `buildThread`. */
  replies: ThreadMessage[];
  depth: number;
  showReplyTo: boolean;
};

export type PinnedMessage = {
  id: string;
  message: string;
  fullName: string;
  profileImage: string | null;
  isAuthor: boolean;
  isCoAuthor: boolean;
};

export type Thread = {
  roots: ThreadMessage[];
  pinned: PinnedMessage[];
  messageCount: number;
};

/**
 * Mask an address for display: `1234567@gmail.com` -> `12****7@gmail.com`.
 *
 * The number of asterisks matches the number of hidden characters, and the
 * short cases are spelled out rather than derived, exactly as
 * `UserProfileMixin.mask_email` did -- a general formula gets 2 and 3 character
 * locals wrong.
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email;
  const [local, domain] = [email.slice(0, email.indexOf("@")), email.slice(email.indexOf("@") + 1)];

  if (local.length <= 1) return email;
  if (local.length === 2) return `${local[0]}*@${domain}`;
  if (local.length === 3) return `${local[0]}*${local.at(-1)}@${domain}`;
  if (local.length === 4) return `${local[0]}**${local.at(-1)}@${domain}`;
  return `${local.slice(0, 2)}${"*".repeat(local.length - 3)}${local.at(-1)}@${domain}`;
}

/**
 * Arrange flat messages into a tree, returning the roots oldest first.
 *
 * A direct port of `apps/guestbook/tree.py`. Three constraints shape it, and
 * each is the reason a line here looks the way it does:
 *
 * - **The window cuts threads.** Only the latest 50 messages are fetched, so a
 *   reply can be inside the window while the message it answers is not. Rather
 *   than chase ancestors with more queries -- unbounded, and it would drag
 *   arbitrarily old messages into a "latest 50" list -- an unmatched reply
 *   becomes a root and keeps a caption naming who it answered. That caption is
 *   exactly what the whole list used to show before it was a tree.
 *
 * - **Indentation has to stop.** `reply_to` is an unbounded self-FK and the
 *   panel is one column down to 375px wide. Past `MAX_DEPTH` a reply attaches
 *   to its grandparent, so it sits *beside* its parent rather than further
 *   right, and gets the same caption.
 *
 * - **The result must be a tree, whatever the rows say.** A parent is only ever
 *   taken from messages already placed, walking oldest first, so no `reply_to`
 *   value can build a cycle -- the recursive component would otherwise recurse
 *   until it died. This is not hypothetical: `sync_guestbook` merges rows from a
 *   second database by natural key and reassigns primary keys, and its
 *   timestamps are only second-accurate.
 */
export function buildThread(messages: ThreadMessage[], maxDepth = MAX_DEPTH): ThreadMessage[] {
  for (const message of messages) {
    message.replies = [];
    message.depth = 0;
    message.showReplyTo = message.replyTo !== null;
  }

  const roots: ThreadMessage[] = [];
  const placed = new Map<string, ThreadMessage>();
  const renderParents = new Map<string, ThreadMessage | null>();

  // The id is a uuid now, so the tiebreak is a string comparison rather than
  // subtraction. It only has to be *stable*, not meaningful: two messages
  // claiming the same instant need a deterministic order, not a chronological
  // one, and insert order stopped being available when the ids stopped being
  // sequential.
  const ordered = [...messages].sort(
    (a, b) => a.timestamp.localeCompare(b.timestamp) || a.id.localeCompare(b.id),
  );

  for (const message of ordered) {
    let parent = message.replyTo ? (placed.get(message.replyTo.id) ?? null) : null;

    if (parent && parent.depth + 1 >= maxDepth) {
      // Too deep: re-attach a level up. The parent is at maxDepth - 1, so this
      // lands the message beside it rather than indented past it.
      parent = renderParents.get(parent.id) ?? null;
    }

    if (parent === null) {
      roots.push(message);
    } else {
      message.depth = parent.depth + 1;
      parent.replies.push(message);
      // The caption earns its place only when the tree does not already show
      // the relationship -- here it does, unless the message was flattened off
      // the parent it actually answered.
      message.showReplyTo = parent.id !== message.replyTo?.id;
    }

    placed.set(message.id, message);
    renderParents.set(message.id, parent);
  }

  return roots;
}
