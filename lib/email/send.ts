import "server-only";

import type { Rendered } from "@/lib/email/render";

/**
 * Sending, over Resend's HTTP API.
 *
 * An HTTP API rather than SMTP, which is the better fit for a serverless
 * request: no connection to hold open, no credentials that time out
 * mid-invocation, and a hard failure comes back as a status code rather than a
 * socket error thirty seconds later.
 *
 * The SDK is not installed for this. One `POST /emails` with a JSON body is the
 * whole API surface used, and the package would be larger than the function it
 * replaces -- the same reasoning that kept `clickSpark` and `countUp`
 * hand-rolled.
 *
 * **Every send is best-effort and never throws at the caller.** The original
 * was explicit about this: a contact form that 500s because an auto-reply
 * bounced has lost the message it was there to deliver. A failure is logged and
 * reported as `false`, and the caller decides whether that matters.
 */

const ENDPOINT = "https://api.resend.com/emails";

/** Matches the per-call timeout on the other third-party clients. */
const TIMEOUT_MS = 10_000;

export type Envelope = {
  to: string[];
  subject: string;
  body: Rendered;
  /** Where a reply should go, when it is somewhere other than the sender. */
  replyTo?: string[];
};

/**
 * The site owner's address(es).
 *
 * `CONTACT_EMAIL_RECIPIENT` is a comma-separated list, and falls back to the
 * from-address so a misconfiguration still delivers somewhere rather than
 * silently dropping the message.
 */
export function ownerEmails(): string[] {
  const raw = process.env.CONTACT_EMAIL_RECIPIENT ?? "";
  const list = raw
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
  return list.length > 0 ? list : [fromAddress()].filter(Boolean);
}

export function fromAddress(): string {
  return (process.env.DEFAULT_FROM_EMAIL ?? "").trim();
}

export async function sendEmail({ to, subject, body, replyTo }: Envelope): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = fromAddress();

  if (!key || !from || to.length === 0) {
    console.error(
      "Email not sent: RESEND_API_KEY, DEFAULT_FROM_EMAIL or a recipient is missing.",
    );
    return false;
  }

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        subject,
        // Both parts, as `attach_alternative` sent: a text body for clients
        // that will not render HTML, and for the spam filters that weigh a
        // missing one.
        html: body.html,
        text: body.text,
        ...(replyTo && replyTo.length > 0 ? { reply_to: replyTo } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(`Email send failed: HTTP ${response.status} ${await response.text()}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}
