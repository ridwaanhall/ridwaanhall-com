import { desc, eq, inArray, sql } from "drizzle-orm";

import { getUserProfiles, type UserProfile } from "@/lib/auth/profile";
import {
  buildThread,
  MAX_PINNED,
  MESSAGE_WINDOW,
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
 * The latest window of messages, threaded, plus the pinned cards and the total.
 *
 * Four queries, none of them per-message: the messages, their reply targets,
 * the pinned set and the count. The profile lookup is batched by
 * `getUserProfiles`, which is where the N+1 would otherwise be -- the same
 * person usually appears many times in one thread.
 *
 * Deliberately **not** cached. Everything else on the site goes through `use
 * cache`, but a guestbook that shows a message a minute after it was posted is
 * broken, and the window is a single indexed query on 50 rows.
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

  const [rows, pinnedRows, [countRow]] = await Promise.all([
    db
      .select(messageColumns)
      .from(guestMessage)
      .orderBy(desc(guestMessage.postedAt))
      .limit(MESSAGE_WINDOW),
    db
      .select(messageColumns)
      .from(guestMessage)
      .where(eq(guestMessage.isPinned, true))
      .orderBy(desc(guestMessage.pinnedAt))
      .limit(MAX_PINNED),
    db.select({ n: sql<number>`count(*)::int` }).from(guestMessage),
  ]);

  // The messages a reply answers may sit outside the window; they are needed
  // for the caption, so they are fetched by id rather than left null (which
  // would silently drop the "replied to X" line the flat list used to be).
  const parentIds = [...new Set(rows.map((row) => row.replyToId).filter((id) => id !== null))];
  const parents = parentIds.length
    ? await db
        .select(messageColumns)
        .from(guestMessage)
        .where(inArray(guestMessage.id, parentIds))
    : [];

  const parentById = new Map(parents.map((row) => [row.id, row]));

  const profiles = await getUserProfiles([
    ...rows.map((row) => row.userId),
    ...parents.map((row) => row.userId),
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
    messageCount: countRow?.n ?? 0,
  };
}
