"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { auth } from "@/auth";
import { getUserProfile } from "@/lib/auth/profile";
import { db } from "@/lib/db/client";
import { notifyNewGuestbookMessage } from "@/lib/email/guestbook-notify";
import { guestbookChatmessage } from "@/lib/db/schema";
import { MAX_MESSAGE_LENGTH, MAX_PINNED, MIN_MESSAGE_LENGTH } from "@/lib/data/guestbook-tree";

/**
 * The guestbook's mutations.
 *
 * These replace the three AJAX views. The shape of the exchange changes and the
 * reason is worth recording: `SendMessageView` returned the whole messages
 * panel as rendered HTML in a JSON field, and the client swapped it into
 * `#guestbook-messages` wholesale. It did that because appending one node
 * client-side means deciding where it goes, which depends on the depth cap and
 * on whether its parent fell inside the fetched window -- a second copy of
 * `tree.py` free to disagree with the first.
 *
 * `revalidatePath` says the same thing without the HTML-in-JSON: the server
 * re-runs `getThread()` and React reconciles the result. There is still exactly
 * one implementation of the threading and one definition of the markup, which
 * was the whole point.
 *
 * **Every action re-checks permission from the database.** The session token
 * says who you are; `getUserProfile` says what you may do. A JWT held for
 * thirty days must not be the authority on who can delete other people's
 * messages -- revoking co-author would not take effect until it expired.
 *
 * Notices are worded here rather than in the client, so these and the comment
 * views stay parallel: a reader sees one feature and it should not phrase
 * itself differently depending on which mechanism carried it.
 */

export type ActionResult = { ok: true; notice: string } | { ok: false; error: string };

const GUESTBOOK_PATH = "/guestbook";

async function currentProfile() {
  const session = await auth();
  const id = Number(session?.user?.id);
  if (!Number.isInteger(id)) return null;
  return getUserProfile(id);
}

export async function sendMessage(formData: FormData): Promise<ActionResult> {
  const profile = await currentProfile();
  if (!profile) return { ok: false, error: "Sign in to post a message." };

  const text = String(formData.get("message") ?? "").trim();
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
  const replyToId = Number(formData.get("reply_to"));
  let replyTo: number | null = null;
  if (Number.isInteger(replyToId) && replyToId > 0) {
    const [parent] = await db
      .select({ id: guestbookChatmessage.id })
      .from(guestbookChatmessage)
      .where(eq(guestbookChatmessage.id, replyToId))
      .limit(1);
    replyTo = parent?.id ?? null;
  }

  const [created] = await db
    .insert(guestbookChatmessage)
    .values({
      userId: profile.id,
      message: text,
      timestamp: new Date().toISOString(),
      replyToId: replyTo,
      isPinned: false,
      pinnedAt: null,
    })
    .returning({ id: guestbookChatmessage.id });

  /*
   * The emails Django's `post_save` receiver sent: the owner, the sender, and
   * whoever is being replied to.
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

export async function deleteMessage(messageId: number): Promise<ActionResult> {
  const profile = await currentProfile();
  if (!profile) return { ok: false, error: "Sign in to manage messages." };
  if (!profile.isAuthor) {
    return { ok: false, error: "Permission denied - Only authors can delete messages" };
  }

  /*
   * The whole branch goes with the node, and the branch has to be gathered
   * here rather than left to the database.
   *
   * **Django's `on_delete=CASCADE` is Python, not SQL.** It collects the
   * related rows and deletes them itself; every foreign key it creates in
   * Postgres is `NO ACTION`, and `guestbook_chatmessage.reply_to_id` is no
   * exception -- `confdeltype` is `a`. So deleting a message that has replies
   * raised a foreign-key violation, and it went unnoticed because the
   * constraints are `DEFERRABLE INITIALLY DEFERRED`: a transaction that rolls
   * back never reaches the check, which is exactly what a test doing its own
   * cleanup does.
   *
   * `reply_to` is unbounded even though the panel only renders three levels, so
   * this walks the branch rather than assuming a depth. Deferred checking is
   * what lets one statement remove a parent and its children together without
   * caring about order.
   */
  const deleted = await db.execute<{ id: number }>(sql`
    with recursive branch as (
      select ${guestbookChatmessage.id} as id
      from ${guestbookChatmessage}
      where ${guestbookChatmessage.id} = ${messageId}
      union all
      select reply.id
      from ${guestbookChatmessage} as reply
      join branch on reply.reply_to_id = branch.id
    )
    delete from ${guestbookChatmessage}
    where ${guestbookChatmessage.id} in (select id from branch)
    returning ${guestbookChatmessage.id} as id
  `).then((result) => result.rows);

  if (deleted.length === 0) return { ok: false, error: "Message not found" };

  revalidatePath(GUESTBOOK_PATH);
  return { ok: true, notice: "Message deleted." };
}

export async function togglePin(messageId: number): Promise<ActionResult> {
  const profile = await currentProfile();
  if (!profile) return { ok: false, error: "Sign in to manage messages." };
  if (!profile.canPin) {
    return {
      ok: false,
      error: "Permission denied - Only authors and co-authors can pin messages",
    };
  }

  const [message] = await db
    .select({ id: guestbookChatmessage.id, isPinned: guestbookChatmessage.isPinned })
    .from(guestbookChatmessage)
    .where(eq(guestbookChatmessage.id, messageId))
    .limit(1);

  if (!message) return { ok: false, error: "Message not found" };

  if (message.isPinned) {
    await db
      .update(guestbookChatmessage)
      .set({ isPinned: false, pinnedAt: null })
      .where(eq(guestbookChatmessage.id, messageId));
    revalidatePath(GUESTBOOK_PATH);
    return { ok: true, notice: "Message unpinned." };
  }

  /*
   * Pinning is capped, and the cap has to hold under concurrency.
   *
   * Two requests could otherwise both read a count under the limit and both
   * save, pushing the pinned set past MAX_PINNED. Serialising them on one
   * deterministic row lock -- the lowest id, which every pinner contends on --
   * is what the original did, and for the reason it recorded: locking only the
   * currently-pinned rows locks nothing when none are pinned yet, and can never
   * cover a row another transaction is in the middle of flipping.
   */
  const result = await db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from guestbook_chatmessage order by id limit 1 for update`,
    );

    // Excluding this message means a concurrent request that already pinned it
    // does not make re-pinning it look like it would exceed the cap.
    const [{ n }] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(guestbookChatmessage)
      .where(
        and(eq(guestbookChatmessage.isPinned, true), ne(guestbookChatmessage.id, messageId)),
      );

    if (n >= MAX_PINNED) {
      return {
        ok: false as const,
        error: `Maximum of ${MAX_PINNED} pinned messages reached. Unpin one first.`,
      };
    }

    await tx
      .update(guestbookChatmessage)
      .set({ isPinned: true, pinnedAt: new Date().toISOString() })
      .where(eq(guestbookChatmessage.id, messageId));

    return { ok: true as const, notice: "Message pinned." };
  });

  if (result.ok) revalidatePath(GUESTBOOK_PATH);
  return result;
}
