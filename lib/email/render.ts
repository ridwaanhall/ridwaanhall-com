import { escapeHtml, messageHtml } from "@/lib/email/escape";
import {
  button,
  fields,
  heading,
  lede,
  note,
  quote,
  shell,
  strong,
  type BadgeTone,
} from "@/lib/email/layout";
import * as text from "@/lib/email/templates";

/**
 * The five transactional emails.
 *
 * Each is a few lines of composition over `layout.ts` rather than a 170-line
 * HTML file, so a change to the header or the card happens once and no two of
 * them can drift into different designs.
 *
 * **The plain-text halves live in `templates.ts`.** There is no design in them
 * to compose, and they are what a client that will not render HTML shows.
 *
 * `fill` throws on an unmatched `{{ key }}` rather than leaving it in place. A
 * plain string replace sends the placeholder to the reader, and an email is not
 * a page you can quietly fix afterwards. `scripts/check-emails.mjs` covers it.
 *
 * **What each one promises about Reply-To is part of its copy**, and the
 * dispatch has to keep it true. `lib/email/guestbook-plan.ts` and
 * `lib/actions/contact.ts` are where the header is actually set:
 *
 *   contactNotification         reply reaches the sender
 *   contactAutoreply            reply reaches the owner
 *   guestbookNotification       reply reaches the poster
 *   guestbookAutoreply          reply reaches the owner
 *   guestbookReplyNotification  reply reaches the owner, never the replier
 *
 * That last one is why the reply notification renders no address for the
 * person who answered: the two readers are strangers to each other, and an
 * address in the body would hand over what the header deliberately withholds.
 */

const PLACEHOLDER = /\{\{\s*([\w.]+)\s*\}\}/g;

function fill(template: string, context: Record<string, string>): string {
  const missing: string[] = [];
  const out = template.replace(PLACEHOLDER, (match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(context, key)) return context[key];
    missing.push(key);
    return match;
  });

  if (missing.length > 0) {
    throw new Error(`Email template is missing values for: ${[...new Set(missing)].join(", ")}`);
  }
  return out;
}

export { escapeHtml };

/** Greeting name, falling back to a generic term — `_display_name`. */
const displayName = (name: string) => name || "there";

/** Sender's name, falling back to their address — `_name_display`. */
const nameDisplay = (name: string, email: string) => name || email;

export type ContactEmail = { name: string; senderEmail: string; message: string };
export type GuestbookEmail = ContactEmail & {
  timestamp: string;
  guestbookUrl: string;
  /** Shows a role pill beside the name. Omitted for an ordinary visitor. */
  role?: BadgeTone;
};
export type ReplyEmail = {
  originalName: string;
  replyName: string;
  /** The *replier's* role, if they hold one. Their address is never rendered. */
  replyRole?: BadgeTone;
  replyMessage: string;
  originalMessage: string;
  timestamp: string;
  guestbookUrl: string;
};

/** An email body in both forms, as every one of these is sent. */
export type Rendered = { html: string; text: string };

export function contactNotification({ name, senderEmail, message }: ContactEmail): Rendered {
  const from = nameDisplay(name, senderEmail);
  return {
    html: shell({
      title: "New contact form message",
      preheader: `${from} sent you a message`,
      eyebrow: "New message",
      content: [
        heading("Someone got in touch"),
        lede("A new message came in through the contact form on your site."),
        fields([
          { label: "From", value: from },
          { label: "Email", value: senderEmail, href: `mailto:${senderEmail}` },
        ]),
        quote({ label: "Message", messageHtml: messageHtml(message) }),
        note(`Replying to this email answers ${escapeHtml(from)} directly.`),
      ].join("\n"),
    }),
    text: fill(text.contactNotificationText, {
      name,
      sender_email: senderEmail,
      message_text: message,
    }),
  };
}

export function contactAutoreply({ name, senderEmail, message }: ContactEmail): Rendered {
  return {
    html: shell({
      title: "Your message is on its way",
      preheader: "Your message reached me — I'll reply soon.",
      eyebrow: "Message sent",
      content: [
        heading("Your message is on its way"),
        lede(
          `Thanks, ${strong(displayName(name))} — it reached me and I will come back to you soon. Here is a copy for your records.`,
        ),
        fields([
          { label: "Name", value: nameDisplay(name, senderEmail) },
          { label: "Email", value: senderEmail },
        ]),
        quote({ label: "Your message", messageHtml: messageHtml(message) }),
        note("Replying to this email reaches me directly — no need to fill the form in again."),
      ].join("\n"),
    }),
    text: fill(text.contactAutoreplyText, {
      display_name: displayName(name),
      name: name || "",
      name_display: nameDisplay(name, senderEmail),
      sender_email: senderEmail,
      message_text: message,
    }),
  };
}

export function guestbookNotification({
  name,
  senderEmail,
  message,
  timestamp,
  guestbookUrl,
  role,
}: GuestbookEmail): Rendered {
  const from = nameDisplay(name, senderEmail);
  return {
    html: shell({
      title: "New guestbook message",
      preheader: `${from} left a message in your guestbook`,
      eyebrow: "Guestbook",
      content: [
        heading(`${from} signed the guestbook`),
        lede("A new message was posted on your guestbook."),
        fields([
          { label: "From", value: from, badge: role },
          // An account can carry no address -- GitHub returns one only when the
          // user has made it public. The row is dropped rather than filled with
          // a stand-in, because a stand-in is an address somebody would try.
          ...(senderEmail
            ? [{ label: "Email", value: senderEmail, href: `mailto:${senderEmail}` }]
            : []),
          { label: "Posted", value: timestamp },
        ]),
        quote({ label: "Message", messageHtml: messageHtml(message) }),
        button({ href: guestbookUrl, label: "Open the guestbook" }),
        // Only promised when it is true: with no address there is no Reply-To,
        // and a reply would go to the send-only sender instead.
        senderEmail ? note(`Replying to this email answers ${escapeHtml(from)} directly.`) : "",
      ].join("\n"),
    }),
    text: fill(text.guestbookNotificationText, {
      name,
      sender_email: senderEmail,
      timestamp,
      message_text: message,
      guestbook_url: guestbookUrl,
    }),
  };
}

export function guestbookAutoreply({
  name,
  senderEmail,
  message,
  timestamp,
  guestbookUrl,
}: GuestbookEmail): Rendered {
  return {
    html: shell({
      title: "Your message is on the guestbook",
      preheader: "Your guestbook message is live.",
      eyebrow: "Message posted",
      content: [
        heading("Your message is on the guestbook"),
        lede(
          `Thanks for signing it, ${strong(displayName(name))}. Here is exactly what went up.`,
        ),
        fields([
          { label: "Name", value: nameDisplay(name, senderEmail) },
          { label: "Email", value: senderEmail },
          { label: "Posted", value: timestamp },
        ]),
        quote({ label: "Your message", messageHtml: messageHtml(message) }),
        button({ href: guestbookUrl, label: "See it on the guestbook" }),
        note(
          "Replying to this email reaches me directly. If someone answers you on the guestbook, I will let you know.",
        ),
      ].join("\n"),
    }),
    text: fill(text.guestbookAutoreplyText, {
      display_name: displayName(name),
      name_display: nameDisplay(name, senderEmail),
      sender_email: senderEmail,
      message_text: message,
      timestamp,
      guestbook_url: guestbookUrl,
    }),
  };
}

export function guestbookReplyNotification({
  originalName,
  replyName,
  replyRole,
  replyMessage,
  originalMessage,
  timestamp,
  guestbookUrl,
}: ReplyEmail): Rendered {
  return {
    html: shell({
      title: "You have received a reply",
      preheader: `${replyName} replied to your guestbook message`,
      eyebrow: "New reply",
      content: [
        heading(`${replyName} replied to you`),
        lede(
          `Hi ${strong(displayName(originalName))} — someone answered the message you left on the guestbook.`,
        ),
        // No address for the replier, deliberately: see the note at the top of
        // this file. The two readers are strangers and Reply-To is the owner.
        fields([
          { label: "Replied by", value: replyName, badge: replyRole },
          { label: "Replied", value: timestamp },
        ]),
        quote({ label: "Their reply", messageHtml: messageHtml(replyMessage) }),
        quote({
          label: "In reply to yours",
          messageHtml: messageHtml(originalMessage),
          tone: "quiet",
        }),
        button({ href: guestbookUrl, label: "Read it on the guestbook" }),
        note(
          `To answer ${escapeHtml(replyName)}, reply on the guestbook — hitting reply here reaches me instead.`,
        ),
      ].join("\n"),
    }),
    text: fill(text.guestbookReplyNotificationText, {
      original_name: displayName(originalName),
      reply_name: replyName,
      reply_message_text: replyMessage,
      original_message_text: originalMessage,
      timestamp,
      guestbook_url: guestbookUrl,
    }),
  };
}
