import * as templates from "@/lib/email/templates";

/**
 * Render one of the transactional emails.
 *
 * **This is where the port fixes a real trap.** Django rendered these with
 * `str.replace` over `{{ key }}` tokens — not the template engine — so a
 * placeholder the calling method forgot was left *in the sent email*, and a
 * `{% %}` tag did nothing at all. CLAUDE.md records it as a gotcha with "no
 * automated test covers these". Here every template declares its keys in the
 * type, and `render` throws if any `{{ … }}` survives, so the failure lands in
 * a log rather than in someone's inbox.
 *
 * Escaping is explicit per key, exactly as the original was: values go into
 * HTML bodies escaped, into text bodies raw, and URLs unescaped (they are
 * ours). Doing it here rather than in the template is what lets one body carry
 * both a `message_html` and a `guestbook_url` with different treatment.
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
    throw new Error(
      `Email template is missing values for: ${[...new Set(missing)].join(", ")}`,
    );
  }
  return out;
}

/** `html.escape`, matching Django's default (quote=True). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/** Escape, then turn newlines into `<br>` — `_format_message_html`. */
function messageHtml(value: string): string {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

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
    html: fill(templates.contactNotificationHtml, {
      name: escapeHtml(name),
      sender_email: escapeHtml(senderEmail),
      message_html: messageHtml(message),
    }),
    text: fill(templates.contactNotificationText, {
      name,
      sender_email: senderEmail,
      message_text: message,
    }),
  };
}

export function contactAutoreply({ name, senderEmail, message }: ContactEmail): Rendered {
  return {
    html: fill(templates.contactAutoreplyHtml, {
      display_name: escapeHtml(displayName(name)),
      name: name ? escapeHtml(name) : "",
      name_display: escapeHtml(nameDisplay(name, senderEmail)),
      sender_email: escapeHtml(senderEmail),
      message_html: messageHtml(message),
    }),
    text: fill(templates.contactAutoreplyText, {
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
    html: fill(templates.guestbookNotificationHtml, {
      name: escapeHtml(name),
      sender_email: escapeHtml(senderEmail),
      timestamp: escapeHtml(timestamp),
      message_html: messageHtml(message),
      // Ours, and escaping it would break the href.
      guestbook_url: guestbookUrl,
    }),
    text: fill(templates.guestbookNotificationText, {
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
    html: fill(templates.guestbookAutoreplyHtml, {
      display_name: escapeHtml(displayName(name)),
      name_display: escapeHtml(nameDisplay(name, senderEmail)),
      sender_email: escapeHtml(senderEmail),
      message_html: messageHtml(message),
      timestamp: escapeHtml(timestamp),
      guestbook_url: guestbookUrl,
    }),
    text: fill(templates.guestbookAutoreplyText, {
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
    html: fill(templates.guestbookReplyNotificationHtml, {
      original_name: escapeHtml(displayName(originalName)),
      reply_name: escapeHtml(replyName),
      reply_message_html: messageHtml(replyMessage),
      original_message_html: messageHtml(originalMessage),
      timestamp: escapeHtml(timestamp),
      guestbook_url: guestbookUrl,
    }),
    text: fill(templates.guestbookReplyNotificationText, {
      original_name: displayName(originalName),
      reply_name: replyName,
      reply_message_text: replyMessage,
      original_message_text: originalMessage,
      timestamp,
      guestbook_url: guestbookUrl,
    }),
  };
}
