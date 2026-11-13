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

/** The database, or a transaction opened on it. */
type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * The key one account's posts contend on, beside `GUESTBOOK_PIN_LOCK`
 * (8_471_002) and the patch notes' 8_471_003.
 */
const POSTING_LOCK = 8_471_004;

/**
 * Hold this account's posting lock until the transaction ends.
 *
 * A count is only a limit if nothing can insert between reading it and
 * writing the post: without the lock, fifty requests sent at once all read a
 * count under the limit and all insert -- and a guestbook message sends up to
 * three emails each. The two-int form keys on the account, so only one
 * account's own posts wait for each other.
 */
export async function lockPosting(tx: Executor, accountId: string): Promise<void> {
  await tx.execute(sql`select pg_advisory_xact_lock(${POSTING_LOCK}::int, hashtext(${accountId}))`);
}

export async function guestbookTooFast(accountId: string, tx: Executor = db): Promise<boolean> {
  const [row] = await tx
    .select({ n: count() })
    .from(guestMessage)
    .where(and(eq(guestMessage.accountId, accountId), gt(guestMessage.postedAt, cutoff)));
  return (row?.n ?? 0) >= POSTS_PER_MINUTE;
}

export async function commentsTooFast(accountId: string, tx: Executor = db): Promise<boolean> {
  const [row] = await tx
    .select({ n: count() })
    .from(comment)
    .where(and(eq(comment.accountId, accountId), gt(comment.createdAt, cutoff)));
  return (row?.n ?? 0) >= POSTS_PER_MINUTE;
}
