import "server-only";

import { and, count, eq, gt, sql } from "drizzle-orm";

import { comment, guestMessage } from "@/lib/db/app-schema";
import { db } from "@/lib/db/client";

/**
 * How fast one account may post.
 *
 * Posting is open to every signed-in account, a guestbook message can send up
 * to three emails, and the only brake there was is the owner switching an
 * account off after the fact. This is the brake before that: a few posts a
 * minute is a person, and more is a script. Read from the rows themselves
 * rather than from memory, because a serverless function has none that lasts
 * between requests -- so it holds across instances, and costs one indexed count.
 */
export const POSTS_PER_MINUTE = 5;

export const SLOW_DOWN = "You are posting quickly. Wait a minute and try again.";

const cutoff = sql`now() - interval '60 seconds'`;

export async function guestbookTooFast(accountId: string): Promise<boolean> {
  const [row] = await db
    .select({ n: count() })
    .from(guestMessage)
    .where(and(eq(guestMessage.accountId, accountId), gt(guestMessage.postedAt, cutoff)));
  return (row?.n ?? 0) >= POSTS_PER_MINUTE;
}

export async function commentsTooFast(accountId: string): Promise<boolean> {
  const [row] = await db
    .select({ n: count() })
    .from(comment)
    .where(and(eq(comment.accountId, accountId), gt(comment.createdAt, cutoff)));
  return (row?.n ?? 0) >= POSTS_PER_MINUTE;
}
