import "server-only";

import { eq } from "drizzle-orm";

import { getUserProfiles } from "@/lib/auth/profile";
import {
  guestbookAutoreply,
  guestbookNotification,
  guestbookReplyNotification,
} from "@/lib/email/render";
import { ownerEmails, sendEmail } from "@/lib/email/send";
import { db } from "@/lib/db/client";
import { guestMessage } from "@/lib/db/app-schema";

/**
 * The emails a new guestbook message sends.
 *
 * A port of the `post_save` receiver in `apps/guestbook/signals.py`, with its
 * three dispatch rules kept exactly:
 *
 *   1. notify the owner — unless the sender *is* the owner
 *   2. confirm to the sender — unless the sender is the owner, or has no address
 *   3. if it is a reply, tell the person being answered — unless that is the
 *      same person, who does not need telling they replied to themselves
 *
 * **Nothing here can fail the post.** The original wrapped the whole receiver
 * in a bare `except` and logged, precisely so a mail server having a bad day
 * could not stop someone leaving a message. Same contract: this is called with
 * `void` after the row is committed, and every send already swallows its own
 * errors.
 *
 * The `raw` guard that receiver needed has no equivalent and needs none — it
 * existed because `loaddata` replays historical rows through `post_save`, and
 * `sync_guestbook` disconnected the receiver for the same reason. Nothing in
 * this stack writes messages except the action that calls this.
 */

/** `'%B %d, %Y at %H:%M:%S'` plus the zone abbreviation, in Asia/Jakarta. */
function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    month: "long",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "short",
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("month")} ${get("day")}, ${get("year")} at ${get("hour")}:${get("minute")}:${get("second")} ${get("timeZoneName")}`;
}

function guestbookUrl(): string {
  const base = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://ridwaanhall.com").replace(/\/$/, "");
  return `${base}/guestbook/`;
}

export async function notifyNewGuestbookMessage(messageId: string): Promise<void> {
  try {
    const [row] = await db
      .select({
        id: guestMessage.id,
        message: guestMessage.body,
        timestamp: guestMessage.postedAt,
        userId: guestMessage.accountId,
        replyToId: guestMessage.replyToId,
      })
      .from(guestMessage)
      .where(eq(guestMessage.id, messageId))
      .limit(1);

    if (!row) return;

    const parent = row.replyToId
      ? (
          await db
            .select({
              message: guestMessage.body,
              userId: guestMessage.accountId,
            })
            .from(guestMessage)
            .where(eq(guestMessage.id, row.replyToId))
            .limit(1)
        )[0]
      : undefined;

    const profiles = await getUserProfiles(
      parent ? [row.userId, parent.userId] : [row.userId],
    );
    const sender = profiles.get(row.userId);
    if (!sender) return;

    const timestamp = formatTimestamp(row.timestamp);
    const url = guestbookUrl();
    const owners = ownerEmails();
    const senderEmail = sender.email || "";
    // The owner posting in their own guestbook should not be emailed about it.
    const isOwner = senderEmail !== "" && owners.includes(senderEmail);

    const payload = {
      name: sender.fullName,
      // The original substituted a no-reply address when the account had none,
      // so the template never renders an empty "from".
      senderEmail: senderEmail || "noreply@ridwaanhall.com",
      message: row.message,
      timestamp,
      guestbookUrl: url,
    };

    if (!isOwner) {
      void sendEmail({
        to: owners,
        subject: `New Guestbook Message from ${sender.fullName}`,
        body: guestbookNotification(payload),
        // No reply-to: this is a notification, not a message to answer.
      });

      if (senderEmail) {
        void sendEmail({
          to: [senderEmail],
          subject: "Your message has been sent.",
          body: guestbookAutoreply(payload),
          replyTo: owners,
        });
      }
    }

    if (parent) {
      const original = profiles.get(parent.userId);
      const originalEmail = original?.email ?? "";
      // Replying to yourself needs no email.
      if (original && originalEmail && originalEmail !== senderEmail) {
        void sendEmail({
          to: [originalEmail],
          subject: "You have received a reply.",
          body: guestbookReplyNotification({
            originalName: original.fullName,
            replyName: sender.fullName,
            replyMessage: row.message,
            originalMessage: parent.message,
            timestamp,
            guestbookUrl: url,
          }),
          replyTo: owners,
        });
      }
    }
  } catch (error) {
    // Logged, never raised: the message is already posted and an email that
    // did not go out must not turn that into a failure the reader sees.
    console.error(`Guestbook notification failed for message ${messageId}:`, error);
  }
}
