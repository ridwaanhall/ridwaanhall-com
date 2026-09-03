"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { auth } from "@/auth";
import { getUserProfile } from "@/lib/auth/profile";
import { db } from "@/lib/db/client";
import { notifyNewGuestbookMessage } from "@/lib/email/guestbook-notify";
import { guestMessage } from "@/lib/db/app-schema";
import { MAX_MESSAGE_LENGTH, MAX_PINNED, MIN_MESSAGE_LENGTH } from "@/lib/data/guestbook-tree";
import { normaliseNewlines } from "@/lib/utils/newlines";

/**
 * The guestbook's mutations.
 *
 * **None of these returns markup, and that is the point.** Appending one
 * message client-side means deciding where it goes, which depends on the depth
 * cap and on whether its parent fell inside the fetched window -- a second
 * implementation of the threading, free to disagree with the first.
 * `revalidatePath` avoids that: the server re-runs `getThread()` and React
 * reconciles the result, so there is one implementation of the threading and
 * one definition of the markup.
 *
 * **Every action re-checks permission from the database.** The session token
 * says who you are; `getUserProfile` says what you may do. Sessions are
 * thirty-day JWTs, so a token that carried the answer would keep asserting it
 * for a month after somebody's staff flag was cleared -- and deleting other
 * people's messages is not a thing to be wrong about for a month.
 *
 * Notices are worded here rather than in the client, so these and the comment
 * views stay parallel: a reader sees one feature and it should not phrase
 * itself differently depending on which mechanism carried it.
 */

export type ActionResult = { ok: true; notice: string } | { ok: false; error: string };

const GUESTBOOK_PATH = "/guestbook";

/**
 * The key every guestbook pin contends on.
 *
 * Arbitrary, and it only has to be stable: advisory locks share one namespace
 * across the whole database, so a second feature wanting one picks a different
 * number and records it beside this.
 */
const GUESTBOOK_PIN_LOCK = 8_471_002;

async function currentProfile() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return getUserProfile(id);
}

export async function sendMessage(formData: FormData): Promise<ActionResult> {
  const profile = await currentProfile();
  if (!profile) return { ok: false, error: "Sign in to post a message." };

  /*
   * And being signed in is no longer the whole of it. `can.guestbook` is false
   * for an account switched off on the Public access screen, and for any
   * inactive one -- which until now meant nothing outside the admin.
   */
  if (!profile.can.guestbook) {
    return { ok: false, error: "This account cannot post to the guestbook." };
  }

  /*
   * Normalised, because the composer is a `<textarea>` and a message is stored
   * exactly as typed. A browser submitting a form rewrites every line break in
   * every field value to CRLF, so without this a two-line message is stored
   * with carriage returns that were never typed -- and the length checked below
   * counts one character per line that nobody wrote.
   */
  const text = normaliseNewlines(String(formData.get("message") ?? "")).trim();
  if (!text) return { ok: false, error: "Message cannot be empty" };
  if (text.length < MIN_MESSAGE_LENGTH) {
    return { ok: false, error: `Message must be at least ${MIN_MESSAGE_LENGTH} characters long` };
  }
  if (text.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: `Message must be ${MAX_MESSAGE_LENGTH} characters or less` };
  }

  /*
   * An unknown or non-numeric `reply_to` posts the message anyway, just not as
   * a reply -- which is what the original did, where a `ValueError` from a
   * non-numeric id and a `DoesNotExist` were caught together. Rejecting the
   * whole post would lose what someone typed over a stale button.
   */
  const replyToId = String(formData.get("reply_to") ?? "");
  let replyTo: string | null = null;
  if (replyToId) {
    const [parent] = await db
      .select({ id: guestMessage.id })
      .from(guestMessage)
      .where(eq(guestMessage.id, replyToId))
      .limit(1);
    replyTo = parent?.id ?? null;
  }

  const [created] = await db
    .insert(guestMessage)
    .values({
      accountId: profile.id,
      body: text,
      postedAt: new Date().toISOString(),
      replyToId: replyTo,
      isPinned: false,
      pinnedAt: null,
    })
    .returning({ id: guestMessage.id });

  /*
   * Three notifications: the owner, the sender, and whoever is being replied
   * to.
   *
   * `after` rather than `await`, so the reader is not kept waiting on three
   * SMTP round trips for a message that is already saved -- and `void` on top,
   * because `notifyNewGuestbookMessage` never rejects. The receiver made the
   * same promise with a bare `except`: a mail server having a bad day must not
   * stop someone leaving a message.
   */
  if (created) after(() => void notifyNewGuestbookMessage(created.id));

  revalidatePath(GUESTBOOK_PATH);
  return { ok: true, notice: replyTo ? "Reply posted." : "Message posted." };
}

export async function deleteMessage(messageId: string): Promise<ActionResult> {
  const profile = await currentProfile();
  if (!profile) return { ok: false, error: "Sign in to manage messages." };
  // Superuser, where pinning below is staff. The asymmetry is inherited rather
  // than invented -- this was author-only while pinning was author-or-co-author
  // -- and it earns its keep: a guestbook delete is a recursive hard delete
  // with no tombstone, so it is the one public act nothing can undo.
  if (!profile.can.deleteMessages) {
    return { ok: false, error: "Only a superuser can delete a guestbook message." };
  }

  /*
   * The whole branch goes with the node, and the branch has to be gathered
   * here rather than left to the database.
   *
   * `guest_message.reply_to_id` cascades in the database, so this is belt and
   * braces rather than the only thing standing between a delete and a foreign
   * key violation. It is here because the *notification* side needs the branch
   * gathered anyway, and because a constraint that were ever declared
   * `DEFERRABLE INITIALLY DEFERRED` would be checked only at commit: a
   * transaction that rolls
   * back never reaches the check, which is exactly what a test doing its own
   * cleanup does.
   *
   * `reply_to` is unbounded even though the panel only renders three levels, so
   * this walks the branch rather than assuming a depth. Deferred checking is
   * what lets one statement remove a parent and its children together without
   * caring about order.
   */
  const deleted = await db.execute<{ id: string }>(sql`
    with recursive branch as (
      select ${guestMessage.id} as id
      from ${guestMessage}
      where ${guestMessage.id} = ${messageId}
      union all
      select reply.id
      from ${guestMessage} as reply
      join branch on reply.reply_to_id = branch.id
    )
    delete from ${guestMessage}
    where ${guestMessage.id} in (select id from branch)
    returning ${guestMessage.id} as id
  `).then((result) => result.rows);

  if (deleted.length === 0) return { ok: false, error: "Message not found" };

  revalidatePath(GUESTBOOK_PATH);
  return { ok: true, notice: "Message deleted." };
}

export async function togglePin(messageId: string): Promise<ActionResult> {
  const profile = await currentProfile();
  if (!profile) return { ok: false, error: "Sign in to manage messages." };
  if (!profile.can.pin) {
    return { ok: false, error: "Only staff can pin a guestbook message." };
  }

  const [message] = await db
    .select({ id: guestMessage.id, isPinned: guestMessage.isPinned })
    .from(guestMessage)
    .where(eq(guestMessage.id, messageId))
    .limit(1);

  if (!message) return { ok: false, error: "Message not found" };

  if (message.isPinned) {
    await db
      .update(guestMessage)
      .set({ isPinned: false, pinnedAt: null })
      .where(eq(guestMessage.id, messageId));
    revalidatePath(GUESTBOOK_PATH);
    return { ok: true, notice: "Message unpinned." };
  }

  /*
   * Pinning is capped, and the cap has to hold under concurrency.
   *
   * Two requests could otherwise both read a count under the limit and both
   * save, pushing the pinned set past MAX_PINNED. So every pinner contends on
   * one lock, held for the transaction that reads the count and writes the flag.
   *
   * **An advisory lock, not a row lock**, and the difference is not cosmetic.
   * A row lock has to name a table, and a table name in a raw SQL string is
   * invisible to `tsc`, to eslint, to the build and to the unit suite -- so
   * nothing objects when it names a table this schema does not have, and
   * `search_path` resolves it against whatever schema does. A row lock also has
   * to find a *row*, so it locks nothing while the table is empty, which is
   * precisely when two first pins would race. This names neither: the key is a
   * constant, the lock exists whether or not any message does, and Postgres
   * releases it when the transaction ends rather than in a `finally` somebody
   * has to remember to write.
   *
   * The cast is what picks the overload -- `pg_advisory_xact_lock` accepts one
   * bigint and also two ints, and an untyped parameter leaves that ambiguous.
   */
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${GUESTBOOK_PIN_LOCK}::bigint)`);

    // Excluding this message means a concurrent request that already pinned it
    // does not make re-pinning it look like it would exceed the cap.
    const [{ n }] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(guestMessage)
      .where(
        and(eq(guestMessage.isPinned, true), ne(guestMessage.id, messageId)),
      );

    if (n >= MAX_PINNED) {
      return {
        ok: false as const,
        error: `Maximum of ${MAX_PINNED} pinned messages reached. Unpin one first.`,
      };
    }

    await tx
      .update(guestMessage)
      .set({ isPinned: true, pinnedAt: new Date().toISOString() })
      .where(eq(guestMessage.id, messageId));

    return { ok: true as const, notice: "Message pinned." };
  });

  if (result.ok) revalidatePath(GUESTBOOK_PATH);
  return result;
}
