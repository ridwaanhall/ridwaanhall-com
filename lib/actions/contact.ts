"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { contactAutoreply, contactNotification } from "@/lib/email/render";
import { ownerEmails, sendEmail } from "@/lib/email/send";
import { verifyTurnstile } from "@/lib/email/turnstile";

/**
 * The contact form's submission.
 *
 * Two emails go out, and only the first of them decides the outcome — exactly
 * as `send_contact_email` did. The notification to the owner is the message;
 * the auto-reply to the visitor is a courtesy, and a form that reports failure
 * because a courtesy bounced has thrown away what it was there to deliver.
 *
 * Turnstile is verified before anything else and a failure is always a
 * rejection, never a pass — see `lib/email/turnstile.ts`.
 */

const Contact = z.object({
  name: z.string().trim().min(1, "Please tell me your name.").max(100),
  email: z.string().trim().email("That email address does not look right.").max(254),
  message: z.string().trim().min(1, "Write something before sending.").max(5000),
});

export type ContactResult = { ok: boolean; message: string };

export async function submitContact(formData: FormData): Promise<ContactResult> {
  const token = formData.get("cf-turnstile-response");
  const requestHeaders = await headers();
  const remoteIp =
    requestHeaders.get("x-forwarded-for")?.split(",")[0].trim() ??
    requestHeaders.get("x-real-ip") ??
    undefined;

  if (!(await verifyTurnstile(typeof token === "string" ? token : null, remoteIp))) {
    return { ok: false, message: "Security verification failed. Please try again." };
  }

  const parsed = Contact.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    // The first message rather than a list: the fields are `required` and
    // `type="email"`, so the browser catches almost everything before this,
    // and a stack of errors under a three-field form is noise.
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check your form data." };
  }

  const { name, email, message } = parsed.data;
  const owners = ownerEmails();

  const delivered = await sendEmail({
    to: owners,
    subject: `New message from ${name}`,
    body: contactNotification({ name, senderEmail: email, message }),
    // A reply goes straight to whoever wrote in, not back to the site.
    replyTo: [email],
  });

  if (!delivered) {
    return {
      ok: false,
      message: "Something went wrong while sending your message. Please try again.",
    };
  }

  // Best-effort, and deliberately not awaited into the result: the visitor's
  // message is already delivered, so a failure here changes nothing they need
  // to act on. `sendEmail` logs and swallows its own errors.
  void sendEmail({
    to: [email],
    subject: "Your message is on its way",
    body: contactAutoreply({ name, senderEmail: email, message }),
    // Replying to the confirmation reaches the owner, not the no-reply sender.
    replyTo: owners,
  });

  return {
    ok: true,
    message: "Thank you—your message has left a trace. I'll be in touch soon.",
  };
}
