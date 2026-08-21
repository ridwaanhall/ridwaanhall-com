import { escapeHtml, messageHtml } from "@/lib/email/escape";
import { button, fields, heading, lede, note, quote, shell, strong } from "@/lib/email/layout";
import * as text from "@/lib/email/templates";

/**
 * The five transactional emails.
 *
 * Each is a few lines of composition over `layout.ts` rather than a 170-line
 * HTML file. The Django originals were five separate templates that had to be
 * edited in step; a change to the header or the card now happens once, and no
 * two of them can drift into different designs.
 *
 * **The plain-text halves are still the originals**, verbatim, in
 * `templates.ts`. There is no design in them to redo, and they are what a
 * client that will not render HTML shows — so they keep the wording the site
 * has always sent.
 *
 * `fill` is what the port added over `str.replace`: Django left an unmatched
 * `{{ key }}` sitting in the *sent* email, which CLAUDE.md records as a gotcha
 * with "no automated test covers these". This throws instead, and
 * `scripts/check-emails.mjs` is that test.
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
export type GuestbookEmail = ContactEmail & { timestamp: string; guestbookUrl: string };
export type ReplyEmail = {
  originalName: string;
  replyName: string;
  replyMessage: string;
  originalMessage: string;
  timestamp: string;
  guestbookUrl: string;
};

/** An email body in both forms, as every one of these is sent. */
export type Rendered = { html: string; text: string };

export function contactNotification({ name, senderEmail, message }: ContactEmail): Rendered {
  return {
    html: shell({
      title: "New contact form message",
      preheader: `${nameDisplay(name, senderEmail)} sent you a message`,
      eyebrow: "New message",
      content: [
        heading("Someone got in touch"),
        lede(`A new message came in through the contact form on your site.`),
        fields([
          { label: "From", value: nameDisplay(name, senderEmail) },
          { label: "Email", value: senderEmail, href: `mailto:${senderEmail}` },
        ]),
        quote({ label: "Message", messageHtml: messageHtml(message) }),
        note("Replying to this email goes straight back to them."),
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
      title: "Thanks for getting in touch",
      preheader: "Your message reached me — I'll reply soon.",
      eyebrow: "Confirmation",
      content: [
        heading(`Thanks, ${displayName(name)}`),
        lede(
          `Your message reached me and I read every one. I usually reply within a day or two.`,
        ),
        quote({ label: "What you sent", messageHtml: messageHtml(message) }),
        note(
          `This is an automatic confirmation, sent to ${strong(senderEmail)}. Replying to it reaches me directly.`,
        ),
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
}: GuestbookEmail): Rendered {
  return {
    html: shell({
      title: "New guestbook message",
      preheader: `${name} left a message in your guestbook`,
      eyebrow: "Guestbook",
      content: [
        heading("A new guestbook message"),
        lede(`${strong(name)} left a message in your guestbook.`),
        fields([
          { label: "From", value: name },
          { label: "Email", value: senderEmail, href: `mailto:${senderEmail}` },
          { label: "Posted", value: timestamp },
        ]),
        quote({ label: "Message", messageHtml: messageHtml(message) }),
        button({ href: guestbookUrl, label: "Open the guestbook" }),
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
      title: "Your message has been sent",
      preheader: "Your guestbook message is live.",
      eyebrow: "Confirmation",
      content: [
        heading(`Thanks, ${displayName(name)}`),
        lede("Your message is up on the guestbook. Thanks for leaving a trace."),
        fields([{ label: "Posted", value: timestamp }]),
        quote({ label: "What you wrote", messageHtml: messageHtml(message) }),
        button({ href: guestbookUrl, label: "See it on the guestbook" }),
        note(
          `Sent to ${strong(nameDisplay(name, senderEmail))}. Replying to this email reaches me directly.`,
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
        heading(`${displayName(originalName)}, you have a reply`),
        lede(`${strong(replyName)} replied to your message in the guestbook.`),
        fields([{ label: "Replied", value: timestamp }]),
        quote({ label: "Their reply", messageHtml: messageHtml(replyMessage) }),
        quote({ label: "Your message", messageHtml: messageHtml(originalMessage) }),
        button({ href: guestbookUrl, label: "Read the thread" }),
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
