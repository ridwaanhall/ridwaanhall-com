/**
 * The **plain-text** halves of the five transactional emails.
 *
 * Kept as prose rather than redesigned: there is nothing visual in them to
 * redo, and they are what a client that will not render HTML shows.
 *
 * Their HTML counterparts are **not** here. Those were the old dark templates
 * and have been redesigned in the site's light theme, composed from
 * `lib/email/layout.ts` -- one shell rather than five files that had to be
 * edited in step.
 *
 * Placeholders are `{{ key }}`, filled by `lib/email/render.ts`, which throws
 * on an unmatched one rather than sending the placeholder to the reader.
 */

/** `contact_autoreply.txt` */
export const contactAutoreplyText = `ridwaanhall.com — Contact Form
════════════════════════════════════════════════════

Hi {{ display_name }},

Thank you for reaching out to Ridwan Halim.
Your message was received and will be reviewed shortly.

YOUR MESSAGE
──────────────────────────────────────────────────────
{{ message_text }}
──────────────────────────────────────────────────────

DETAILS
  Name    {{ name_display }}
  Email   {{ sender_email }}

Ridwan typically responds within 1–3 business days.
For anything urgent, reply directly to this email.

════════════════════════════════════════════════════
ridwaanhall.com · Automated notice
`;

/** `contact_notification.txt` */
export const contactNotificationText = `ridwaanhall.com — New Message
════════════════════════════════════════════════════

New contact form submission.

FROM
  Name    {{ name }}
  Email   {{ sender_email }}

MESSAGE
──────────────────────────────────────────────────────
{{ message_text }}
──────────────────────────────────────────────────────

Reply to this email to respond directly to {{ sender_email }}.

════════════════════════════════════════════════════
ridwaanhall.com · Automated notification
`;

/** `guestbook_autoreply.txt` */
export const guestbookAutoreplyText = `ridwaanhall.com — Guestbook
════════════════════════════════════════════════════

Hi {{ display_name }},

Your guestbook entry is now live at ridwaanhall.com.
It's visible to everyone who visits the guestbook.

YOUR ENTRY
──────────────────────────────────────────────────────
{{ message_text }}
──────────────────────────────────────────────────────

DETAILS
  Name       {{ name_display }}
  Email      {{ sender_email }}
  Posted     {{ timestamp }}

VIEW GUESTBOOK
  {{ guestbook_url }}

Replying to this email reaches Ridwan directly.
If someone answers you on the guestbook, you will hear about it.

════════════════════════════════════════════════════
ridwaanhall.com · Automated notice
`;

/** `guestbook_notification.txt` */
export const guestbookNotificationText = `ridwaanhall.com — New Entry
════════════════════════════════════════════════════

New guestbook entry.

FROM
  Name       {{ name }}
  Email      {{ sender_email }}
  Posted     {{ timestamp }}

ENTRY
──────────────────────────────────────────────────────
{{ message_text }}
──────────────────────────────────────────────────────

Reply to this email to respond directly to {{ sender_email }}.

OPEN GUESTBOOK
  {{ guestbook_url }}

════════════════════════════════════════════════════
ridwaanhall.com · Automated notification
`;

/** `guestbook_reply_notification.txt` */
export const guestbookReplyNotificationText = `ridwaanhall.com — Reply
════════════════════════════════════════════════════

Hi {{ original_name }},

{{ reply_name }} replied to your guestbook entry at ridwaanhall.com.

YOUR ORIGINAL ENTRY
──────────────────────────────────────────────────────
{{ original_message_text }}
──────────────────────────────────────────────────────

REPLY FROM {{ reply_name }} · {{ timestamp }}
──────────────────────────────────────────────────────
{{ reply_message_text }}
──────────────────────────────────────────────────────

VIEW FULL CONVERSATION
  {{ guestbook_url }}

To answer {{ reply_name }}, reply on the guestbook.
Replying to this email reaches Ridwan instead.

════════════════════════════════════════════════════
ridwaanhall.com · Reply notification
`;
