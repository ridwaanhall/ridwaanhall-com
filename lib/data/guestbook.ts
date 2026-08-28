import { desc, eq } from "drizzle-orm";

import { getUserProfiles, type UserProfile } from "@/lib/auth/profile";
import {
  buildThread,
  MAX_PINNED,
  maskEmail,
  type MessageAuthor,
  type Thread,
  type ThreadMessage,
} from "@/lib/data/guestbook-tree";
import { db } from "@/lib/db/client";
import { guestMessage } from "@/lib/db/app-schema";

/**
 * The guestbook's one query path.
 *
 * The page and every action that changes the thread go through `getThread()`,
 * so there is exactly one place that decides what a message is and how the tree
 * is shaped -- rather than the page and each action each deciding for
 * themselves and drifting apart.
 */

/**
 * Every message, threaded, plus the pinned cards and the total.
 *
 * **The whole guestbook, not a window.** This used to take the latest 50 and
 * the conversation simply stopped there, with nothing on screen to say so --
 * while the header, which counts the table, went on reporting a total the list
 * below it did not contain. Scrolling up reached the oldest message the query
 * happened to return rather than the first one anybody wrote. The panel is a
 * scroll region that opens at the newest message, so the ones above it cost a
 * reader nothing but scrollback.
 *
 * What bounds this is the row rather than the count. `body` is capped at 500
 * characters and a message carries one author, so the whole thread is tens of
 * kilobytes -- and a guestbook grows by a page or two a month. Every row is
 * serialised to the client whether or not anyone scrolls to it, though, so if
 * this ever reaches the low thousands it is here that paging has to start.
 *
 * Two queries, neither of them per-message: the messages and the pinned set. A
 * reply's target is found among the messages themselves rather than fetched,
 * and the total is how many came back. The profile lookup is batched by
 * `getUserProfiles`, which is where the N+1 would otherwise be -- the same
 * person usually appears many times in one thread.
 *
 * Deliberately **not** cached. Everything else on the site goes through `use
 * cache`, but a guestbook that shows a message a minute after it was posted is
 * broken, and this is one indexed table read end to end.
 */
export async function getThread(): Promise<Thread> {
  const messageColumns = {
    id: guestMessage.id,
    message: guestMessage.body,
    timestamp: guestMessage.postedAt,
    isPinned: guestMessage.isPinned,
    replyToId: guestMessage.replyToId,
    userId: guestMessage.accountId,
  };

  const [rows, pinnedRows] = await Promise.all([
    db.select(messageColumns).from(guestMessage).orderBy(desc(guestMessage.postedAt)),
    db
      .select(messageColumns)
      .from(guestMessage)
      .where(eq(guestMessage.isPinned, true))
      .orderBy(desc(guestMessage.pinnedAt))
      .limit(MAX_PINNED),
  ]);

  // A reply answers another message, and every message is in `rows`, so both
  // the nesting and the "replied to X" caption are answered from what has
  // already been fetched rather than by a second query for the targets.
  const parentById = new Map(rows.map((row) => [row.id, row]));

  const profiles = await getUserProfiles([
    ...rows.map((row) => row.userId),
    ...pinnedRows.map((row) => row.userId),
  ]);

  const author = (userId: string): MessageAuthor => {
    const profile: UserProfile | undefined = profiles.get(userId);
    return {
      userId,
      fullName: profile?.fullName ?? "Unknown",
      profileImage: profile?.profileImage ?? null,
      isAuthor: profile?.isAuthor ?? false,
      isCoAuthor: profile?.isCoAuthor ?? false,
      coAuthorOrder: profile?.coAuthorOrder ?? 0,
      email: maskEmail(profile?.email ?? ""),
    };
  };

  const messages: ThreadMessage[] = rows.map((row) => {
    const parent = row.replyToId === null ? undefined : parentById.get(row.replyToId);
    return {
      id: row.id,
      message: row.message,
      timestamp: row.timestamp,
      isPinned: row.isPinned,
      ...author(row.userId),
      replyTo: parent
        ? { id: parent.id, message: parent.message, ...author(parent.userId) }
        : null,
      replies: [],
      depth: 0,
      showReplyTo: false,
    };
  });

  return {
    roots: buildThread(messages),
    pinned: pinnedRows.map((row) => {
      const profile = profiles.get(row.userId);
      return {
        id: row.id,
        message: row.message,
        fullName: profile?.fullName ?? "Unknown",
        profileImage: profile?.profileImage ?? null,
        isAuthor: profile?.isAuthor ?? false,
        isCoAuthor: profile?.isCoAuthor ?? false,
      };
    }),
    messageCount: rows.length,
  };
}
