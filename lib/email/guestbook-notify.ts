import "server-only";

import { eq } from "drizzle-orm";

import { getUserProfiles, type UserProfile } from "@/lib/auth/profile";
import { planGuestbookEmails } from "@/lib/email/guestbook-plan";
import {
  guestbookAutoreply,
  guestbookNotification,
  guestbookReplyNotification,
} from "@/lib/email/render";
import { ownerEmails, sendEmail } from "@/lib/email/send";
import { db } from "@/lib/db/client";
import { guestMessage } from "@/lib/db/app-schema";
import type { BadgeTone } from "@/lib/email/layout";

/**
 * The emails a new guestbook message sends.
 *
 * **Which emails, and what each replies to, is decided in
 * `lib/email/guestbook-plan.ts`** -- a pure function with the whole matrix
 * under test. This file loads the rows, renders the bodies and posts them, and
 * holds no rules of its own. The two were interleaved before, which left three
 * emails and five exceptions reachable only by posting a real message.
 *
 * **Nothing here can fail the post.** The whole body is wrapped in a `catch`
 * that only logs, precisely so a mail server having a bad day cannot stop
 * somebody leaving a message. It is called with `void` after the row is
 * committed, and every send already swallows its own errors.
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

/** The pill the emails show beside a name, or nothing for an ordinary reader. */
function roleOf(profile: UserProfile): BadgeTone | undefined {
  return profile.role === "public" ? undefined : profile.role;
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

    const original = parent ? profiles.get(parent.userId) : undefined;

    const timestamp = formatTimestamp(row.timestamp);
    const url = guestbookUrl();
    const role = roleOf(sender);

    // The flags come from `guest_profile`, read from the database on every
    // request. They are never in the session token, so taking a role away takes
    // effect on the next post rather than whenever a thirty-day JWT expires.
    const plan = planGuestbookEmails({
      sender: {
        email: sender.email,
        isSuperuser: sender.role === "superuser",
        isStaff: sender.role !== "public",
      },
      parentAuthor: original ? { email: original.email } : undefined,
      owners: ownerEmails(),
    });

    const payload = {
      name: sender.fullName,
      senderEmail: sender.email,
      message: row.message,
      timestamp,
      guestbookUrl: url,
      role,
    };

    for (const dispatch of plan) {
      switch (dispatch.kind) {
        case "owner":
          void sendEmail({
            to: dispatch.to,
            subject: `${sender.fullName} signed your guestbook`,
            body: guestbookNotification(payload),
            replyTo: dispatch.replyTo,
          });
          break;

        case "confirm":
          void sendEmail({
            to: dispatch.to,
            subject: "Your message is on the guestbook",
            body: guestbookAutoreply(payload),
            replyTo: dispatch.replyTo,
          });
          break;

        case "reply":
          // The planner only emits this when there is a parent with an address,
          // but it does not carry the message text — so both are re-checked
          // here rather than asserted.
          if (!parent || !original) break;
          void sendEmail({
            to: dispatch.to,
            subject: `${sender.fullName} replied to you`,
            body: guestbookReplyNotification({
              originalName: original.fullName,
              replyName: sender.fullName,
              replyRole: role,
              replyMessage: row.message,
              originalMessage: parent.message,
              timestamp,
              guestbookUrl: url,
            }),
            replyTo: dispatch.replyTo,
          });
          break;
      }
    }
  } catch (error) {
    // Logged, never raised: the message is already posted and an email that
    // did not go out must not turn that into a failure the reader sees.
    console.error(`Guestbook notification failed for message ${messageId}:`, error);
  }
}
