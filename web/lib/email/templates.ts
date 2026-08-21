/**
 * The site's transactional email bodies, five HTML/text pairs.
 *
 * Copied **verbatim** from `apps/core/templates/core/email/` by
 * `scripts/inline-email-templates.mjs` -- not re-authored. They are 62KB of
 * hand-tuned, table-based markup that renders correctly across mail clients,
 * and all five share the dark palette the site uses (`#09090b` canvas,
 * `#18181b` card, `#6366f1` indigo accent).
 *
 * Placeholders are `{{ key }}`, filled by `lib/email/render.ts`. That module is
 * where the port improves on the original: Django replaced tokens with
 * `str.replace` and left an unmatched `{{ key }}` sitting in the sent email --
 * exactly the trap CLAUDE.md warns about. Rendering here fails loudly instead.
 *
 * Regenerate with `node scripts/inline-email-templates.mjs` while the Django
 * tree still exists; after cutover this file is the source.
 */

/** `contact_autoreply.html` */
export const contactAutoreplyHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
    <title>Thanks for reaching out</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;-webkit-font-smoothing:antialiased;">

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#09090b">
        <tr>
            <td align="center" style="padding:40px 16px;">

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;background:#18181b;border:1px solid #27272a;border-radius:12px;overflow:hidden;">

                    <tr>
                        <td bgcolor="#18181b" style="border-bottom:1px solid #27272a;padding:16px 24px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td valign="middle">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td bgcolor="#6366f1" width="26" style="width:26px;height:26px;border-radius:50%;text-align:center;vertical-align:middle;line-height:26px;">
                                                    <span style="color:#ffffff;font-size:13px;font-weight:600;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">R</span>
                                                </td>
                                                <td style="padding-left:10px;vertical-align:middle;">
                                                    <span style="color:#e4e4e7;font-size:14px;font-weight:600;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">ridwaanhall.com</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td align="right" valign="middle">
                                        <span style="color:#71717a;font-size:12px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Contact Form</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:28px 24px 8px;">

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px;">
                                <tr>
                                    <td width="36" valign="top" style="padding-right:10px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td bgcolor="#6366f1" width="24" style="width:24px;height:24px;border-radius:50%;"></td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td valign="top">
                                        <p style="margin:0;font-size:15px;line-height:1.65;color:#a1a1aa;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Hi <strong style="color:#e4e4e7;">{{ display_name }}</strong>, thank you for reaching out to Ridwan Halim. Here's a copy of what you submitted:</p>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
                                <tr>
                                    <td width="80">&nbsp;</td>
                                    <td>
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td bgcolor="#27272a" style="border-radius:16px 16px 16px 3px;padding:12px 16px;">
                                                    <div style="font-size:15px;line-height:1.65;color:#d4d4d8;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{ message_html }}</div>
                                                </td>
                                            </tr>
                                        </table>
                                        <p style="margin:5px 0 0;text-align:right;font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{ name_display }} &nbsp;&middot;&nbsp; {{ sender_email }}</p>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:0;">
                                <tr>
                                    <td width="36" valign="top" style="padding-right:10px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td bgcolor="#6366f1" width="24" style="width:24px;height:24px;border-radius:50%;"></td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td valign="top">
                                        <p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:#a1a1aa;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Ridwan will review your message and typically gets back within <strong style="color:#e4e4e7;">1–3 business days</strong>. For anything urgent, just reply to this email.</p>
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top:14px;">
                                            <tr>
                                                <td bgcolor="#1f1f23" style="border-radius:10px;border:1px solid #27272a;padding:4px 14px;">
                                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                        <tr>
                                                            <td style="padding:8px 0;border-bottom:1px solid #27272a;width:68px;vertical-align:top;">
                                                                <span style="font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Name</span>
                                                            </td>
                                                            <td style="padding:8px 0 8px 12px;border-bottom:1px solid #27272a;vertical-align:top;">
                                                                <span style="font-size:14px;color:#e4e4e7;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{ name_display }}</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding:8px 0;width:68px;vertical-align:top;">
                                                                <span style="font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Email</span>
                                                            </td>
                                                            <td style="padding:8px 0 8px 12px;vertical-align:top;">
                                                                <span style="font-size:14px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;"><a href="mailto:{{ sender_email }}" style="color:#818cf8;text-decoration:none;">{{ sender_email }}</a></span>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <tr>
                        <td style="height:32px;"></td>
                    </tr>

                    <tr>
                        <td style="border-top:1px solid #27272a;padding:14px 24px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td>
                                        <span style="font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                                            <a href="https://ridwaanhall.com" style="color:#71717a;text-decoration:none;">ridwaanhall.com</a> &nbsp;&middot;&nbsp; Automated
                                        </span>
                                    </td>
                                    <td align="right">
                                        <span style="font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Contact Form</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
`;

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

/** `contact_notification.html` */
export const contactNotificationHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
    <title>New Contact Form Message</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;-webkit-font-smoothing:antialiased;">

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#09090b">
        <tr>
            <td align="center" style="padding:40px 16px;">

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;background:#18181b;border:1px solid #27272a;border-radius:12px;overflow:hidden;">

                    <tr>
                        <td bgcolor="#18181b" style="border-bottom:1px solid #27272a;padding:16px 24px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td valign="middle">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td bgcolor="#6366f1" width="26" style="width:26px;height:26px;border-radius:50%;text-align:center;vertical-align:middle;line-height:26px;">
                                                    <span style="color:#ffffff;font-size:13px;font-weight:600;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">R</span>
                                                </td>
                                                <td style="padding-left:10px;vertical-align:middle;">
                                                    <span style="color:#e4e4e7;font-size:14px;font-weight:600;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">ridwaanhall.com</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td align="right" valign="middle">
                                        <span style="color:#71717a;font-size:12px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">New Message</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:28px 24px 8px;">

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px;">
                                <tr>
                                    <td width="36" valign="top" style="padding-right:10px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td bgcolor="#6366f1" width="24" style="width:24px;height:24px;border-radius:50%;"></td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td valign="top">
                                        <p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:#a1a1aa;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">New contact form submission from <strong style="color:#e4e4e7;">{{ name }}</strong>.</p>
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top:10px;">
                                            <tr>
                                                <td bgcolor="#1f1f23" style="border-radius:10px;border:1px solid #27272a;padding:4px 14px;">
                                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                        <tr>
                                                            <td style="padding:8px 0;border-bottom:1px solid #27272a;width:68px;vertical-align:top;">
                                                                <span style="font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">From</span>
                                                            </td>
                                                            <td style="padding:8px 0 8px 12px;border-bottom:1px solid #27272a;vertical-align:top;">
                                                                <span style="font-size:14px;color:#e4e4e7;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{ name }}</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding:8px 0;width:68px;vertical-align:top;">
                                                                <span style="font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Email</span>
                                                            </td>
                                                            <td style="padding:8px 0 8px 12px;vertical-align:top;">
                                                                <span style="font-size:14px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;"><a href="mailto:{{ sender_email }}" style="color:#818cf8;text-decoration:none;">{{ sender_email }}</a></span>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
                                <tr>
                                    <td width="80">&nbsp;</td>
                                    <td>
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td bgcolor="#27272a" style="border-radius:16px 16px 16px 3px;padding:12px 16px;">
                                                    <div style="font-size:15px;line-height:1.65;color:#d4d4d8;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{ message_html }}</div>
                                                </td>
                                            </tr>
                                        </table>
                                        <p style="margin:5px 0 0;text-align:right;font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{ name }} &nbsp;&middot;&nbsp; {{ sender_email }}</p>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:0;">
                                <tr>
                                    <td width="36" valign="top" style="padding-right:10px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td bgcolor="#6366f1" width="24" style="width:24px;height:24px;border-radius:50%;"></td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td valign="top">
                                        <p style="margin:0;font-size:15px;line-height:1.65;color:#a1a1aa;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Reply to this email to respond directly to <strong style="color:#e4e4e7;">{{ sender_email }}</strong>.</p>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <tr>
                        <td style="height:32px;"></td>
                    </tr>

                    <tr>
                        <td style="border-top:1px solid #27272a;padding:14px 24px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td>
                                        <span style="font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                                            <a href="https://ridwaanhall.com" style="color:#71717a;text-decoration:none;">ridwaanhall.com</a> &nbsp;&middot;&nbsp; Automated
                                        </span>
                                    </td>
                                    <td align="right">
                                        <span style="font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">New Message</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
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

/** `guestbook_autoreply.html` */
export const guestbookAutoreplyHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
    <title>Your Guestbook Entry Is Live</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;-webkit-font-smoothing:antialiased;">

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#09090b">
        <tr>
            <td align="center" style="padding:40px 16px;">

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;background:#18181b;border:1px solid #27272a;border-radius:12px;overflow:hidden;">

                    <tr>
                        <td bgcolor="#18181b" style="border-bottom:1px solid #27272a;padding:16px 24px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td valign="middle">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td bgcolor="#6366f1" width="26" style="width:26px;height:26px;border-radius:50%;text-align:center;vertical-align:middle;line-height:26px;">
                                                    <span style="color:#ffffff;font-size:13px;font-weight:600;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">R</span>
                                                </td>
                                                <td style="padding-left:10px;vertical-align:middle;">
                                                    <span style="color:#e4e4e7;font-size:14px;font-weight:600;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">ridwaanhall.com</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td align="right" valign="middle">
                                        <span style="color:#71717a;font-size:12px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Guestbook</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:28px 24px 8px;">

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px;">
                                <tr>
                                    <td width="36" valign="top" style="padding-right:10px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td bgcolor="#6366f1" width="24" style="width:24px;height:24px;border-radius:50%;"></td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td valign="top">
                                        <p style="margin:0;font-size:15px;line-height:1.65;color:#a1a1aa;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Hi <strong style="color:#e4e4e7;">{{ display_name }}</strong>, your guestbook entry is now live at ridwaanhall.com.</p>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
                                <tr>
                                    <td width="80">&nbsp;</td>
                                    <td>
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td bgcolor="#27272a" style="border-radius:16px 16px 16px 3px;padding:12px 16px;">
                                                    <div style="font-size:15px;line-height:1.65;color:#d4d4d8;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{ message_html }}</div>
                                                </td>
                                            </tr>
                                        </table>
                                        <p style="margin:5px 0 0;text-align:right;font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{ name_display }} &nbsp;&middot;&nbsp; {{ timestamp }}</p>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:0;">
                                <tr>
                                    <td width="36" valign="top" style="padding-right:10px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td bgcolor="#6366f1" width="24" style="width:24px;height:24px;border-radius:50%;"></td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td valign="top">
                                        <p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:#a1a1aa;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Your entry is visible to everyone who visits the guestbook.</p>
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top:14px;">
                                            <tr>
                                                <td bgcolor="#1f1f23" style="border-radius:10px;border:1px solid #27272a;padding:4px 14px;">
                                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                        <tr>
                                                            <td style="padding:8px 0;border-bottom:1px solid #27272a;width:68px;vertical-align:top;">
                                                                <span style="font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Name</span>
                                                            </td>
                                                            <td style="padding:8px 0 8px 12px;border-bottom:1px solid #27272a;vertical-align:top;">
                                                                <span style="font-size:14px;color:#e4e4e7;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{ name_display }}</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding:8px 0;border-bottom:1px solid #27272a;width:68px;vertical-align:top;">
                                                                <span style="font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Email</span>
                                                            </td>
                                                            <td style="padding:8px 0 8px 12px;border-bottom:1px solid #27272a;vertical-align:top;">
                                                                <span style="font-size:14px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;"><a href="mailto:{{ sender_email }}" style="color:#818cf8;text-decoration:none;">{{ sender_email }}</a></span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding:8px 0;width:68px;vertical-align:top;">
                                                                <span style="font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Posted</span>
                                                            </td>
                                                            <td style="padding:8px 0 8px 12px;vertical-align:top;">
                                                                <span style="font-size:14px;color:#e4e4e7;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{ timestamp }}</span>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-top:12px;">
                                            <tr>
                                                <td bgcolor="#6366f1" style="border-radius:8px;padding:10px 20px;">
                                                    <a href="{{ guestbook_url }}" style="color:#ffffff;font-size:14px;font-weight:500;text-decoration:none;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">View guestbook &#8594;</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <tr>
                        <td style="height:32px;"></td>
                    </tr>

                    <tr>
                        <td style="border-top:1px solid #27272a;padding:14px 24px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td>
                                        <span style="font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                                            <a href="https://ridwaanhall.com" style="color:#71717a;text-decoration:none;">ridwaanhall.com</a> &nbsp;&middot;&nbsp; Automated
                                        </span>
                                    </td>
                                    <td align="right">
                                        <span style="font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Guestbook</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
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

════════════════════════════════════════════════════
ridwaanhall.com · Automated notice
`;

/** `guestbook_notification.html` */
export const guestbookNotificationHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
    <title>New Guestbook Entry</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;-webkit-font-smoothing:antialiased;">

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#09090b">
        <tr>
            <td align="center" style="padding:40px 16px;">

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;background:#18181b;border:1px solid #27272a;border-radius:12px;overflow:hidden;">

                    <tr>
                        <td bgcolor="#18181b" style="border-bottom:1px solid #27272a;padding:16px 24px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td valign="middle">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td bgcolor="#6366f1" width="26" style="width:26px;height:26px;border-radius:50%;text-align:center;vertical-align:middle;line-height:26px;">
                                                    <span style="color:#ffffff;font-size:13px;font-weight:600;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">R</span>
                                                </td>
                                                <td style="padding-left:10px;vertical-align:middle;">
                                                    <span style="color:#e4e4e7;font-size:14px;font-weight:600;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">ridwaanhall.com</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td align="right" valign="middle">
                                        <span style="color:#71717a;font-size:12px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">New Entry</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:28px 24px 8px;">

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px;">
                                <tr>
                                    <td width="36" valign="top" style="padding-right:10px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td bgcolor="#6366f1" width="24" style="width:24px;height:24px;border-radius:50%;"></td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td valign="top">
                                        <p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:#a1a1aa;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">New guestbook entry from <strong style="color:#e4e4e7;">{{ name }}</strong>.</p>
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top:10px;">
                                            <tr>
                                                <td bgcolor="#1f1f23" style="border-radius:10px;border:1px solid #27272a;padding:4px 14px;">
                                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                        <tr>
                                                            <td style="padding:8px 0;border-bottom:1px solid #27272a;width:68px;vertical-align:top;">
                                                                <span style="font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">From</span>
                                                            </td>
                                                            <td style="padding:8px 0 8px 12px;border-bottom:1px solid #27272a;vertical-align:top;">
                                                                <span style="font-size:14px;color:#e4e4e7;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{ name }}</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding:8px 0;border-bottom:1px solid #27272a;width:68px;vertical-align:top;">
                                                                <span style="font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Email</span>
                                                            </td>
                                                            <td style="padding:8px 0 8px 12px;border-bottom:1px solid #27272a;vertical-align:top;">
                                                                <span style="font-size:14px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;"><a href="mailto:{{ sender_email }}" style="color:#818cf8;text-decoration:none;">{{ sender_email }}</a></span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding:8px 0;width:68px;vertical-align:top;">
                                                                <span style="font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Posted</span>
                                                            </td>
                                                            <td style="padding:8px 0 8px 12px;vertical-align:top;">
                                                                <span style="font-size:14px;color:#e4e4e7;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{ timestamp }}</span>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
                                <tr>
                                    <td width="80">&nbsp;</td>
                                    <td>
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td bgcolor="#27272a" style="border-radius:16px 16px 16px 3px;padding:12px 16px;">
                                                    <div style="font-size:15px;line-height:1.65;color:#d4d4d8;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{ message_html }}</div>
                                                </td>
                                            </tr>
                                        </table>
                                        <p style="margin:5px 0 0;text-align:right;font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{ name }} &nbsp;&middot;&nbsp; {{ timestamp }}</p>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:0;">
                                <tr>
                                    <td width="36" valign="top" style="padding-right:10px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td bgcolor="#6366f1" width="24" style="width:24px;height:24px;border-radius:50%;"></td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td valign="top">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-top:0;">
                                            <tr>
                                                <td bgcolor="#6366f1" style="border-radius:8px;padding:10px 20px;">
                                                    <a href="{{ guestbook_url }}" style="color:#ffffff;font-size:14px;font-weight:500;text-decoration:none;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Open guestbook &#8594;</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <tr>
                        <td style="height:32px;"></td>
                    </tr>

                    <tr>
                        <td style="border-top:1px solid #27272a;padding:14px 24px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td>
                                        <span style="font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                                            <a href="https://ridwaanhall.com" style="color:#71717a;text-decoration:none;">ridwaanhall.com</a> &nbsp;&middot;&nbsp; Automated
                                        </span>
                                    </td>
                                    <td align="right">
                                        <span style="font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">New Entry</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
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

OPEN GUESTBOOK
  {{ guestbook_url }}

════════════════════════════════════════════════════
ridwaanhall.com · Automated notification
`;

/** `guestbook_reply_notification.html` */
export const guestbookReplyNotificationHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
    <title>You Have a Reply</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;-webkit-font-smoothing:antialiased;">

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#09090b">
        <tr>
            <td align="center" style="padding:40px 16px;">

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;background:#18181b;border:1px solid #27272a;border-radius:12px;overflow:hidden;">

                    <tr>
                        <td bgcolor="#18181b" style="border-bottom:1px solid #27272a;padding:16px 24px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td valign="middle">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td bgcolor="#6366f1" width="26" style="width:26px;height:26px;border-radius:50%;text-align:center;vertical-align:middle;line-height:26px;">
                                                    <span style="color:#ffffff;font-size:13px;font-weight:600;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">R</span>
                                                </td>
                                                <td style="padding-left:10px;vertical-align:middle;">
                                                    <span style="color:#e4e4e7;font-size:14px;font-weight:600;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">ridwaanhall.com</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td align="right" valign="middle">
                                        <span style="color:#71717a;font-size:12px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Reply</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:28px 24px 8px;">

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px;">
                                <tr>
                                    <td width="36" valign="top" style="padding-right:10px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td bgcolor="#6366f1" width="24" style="width:24px;height:24px;border-radius:50%;"></td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td valign="top">
                                        <p style="margin:0;font-size:15px;line-height:1.65;color:#a1a1aa;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Hi <strong style="color:#e4e4e7;">{{ original_name }}</strong>, <strong style="color:#e4e4e7;">{{ reply_name }}</strong> replied to your guestbook entry at ridwaanhall.com.</p>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:12px;">
                                <tr>
                                    <td width="80">&nbsp;</td>
                                    <td>
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td bgcolor="#1f1f23" style="border-radius:16px 16px 16px 3px;padding:12px 16px;border:1px solid #27272a;">
                                                    <div style="font-size:13px;line-height:1.65;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{ original_message_html }}</div>
                                                </td>
                                            </tr>
                                        </table>
                                        <p style="margin:5px 0 0;text-align:right;font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{ original_name }} &nbsp;&middot;&nbsp; your entry</p>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
                                <tr>
                                    <td width="36" valign="top" style="padding-right:10px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td bgcolor="#6366f1" width="24" style="width:24px;height:24px;border-radius:50%;"></td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td valign="top">
                                        <p style="margin:0 0 7px;font-size:13px;font-weight:600;color:#e4e4e7;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{ reply_name }}</p>
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td bgcolor="#27272a" style="border-radius:3px 16px 16px 16px;padding:12px 16px;">
                                                    <div style="font-size:15px;line-height:1.65;color:#d4d4d8;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{ reply_message_html }}</div>
                                                </td>
                                            </tr>
                                        </table>
                                        <p style="margin:5px 0 0;font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">{{ timestamp }}</p>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:0;">
                                <tr>
                                    <td width="36" valign="top" style="padding-right:10px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td bgcolor="#6366f1" width="24" style="width:24px;height:24px;border-radius:50%;"></td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td valign="top">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-top:0;">
                                            <tr>
                                                <td bgcolor="#6366f1" style="border-radius:8px;padding:10px 20px;">
                                                    <a href="{{ guestbook_url }}" style="color:#ffffff;font-size:14px;font-weight:500;text-decoration:none;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">View full conversation &#8594;</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <tr>
                        <td style="height:32px;"></td>
                    </tr>

                    <tr>
                        <td style="border-top:1px solid #27272a;padding:14px 24px;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td>
                                        <span style="font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                                            <a href="https://ridwaanhall.com" style="color:#71717a;text-decoration:none;">ridwaanhall.com</a> &nbsp;&middot;&nbsp; Automated
                                        </span>
                                    </td>
                                    <td align="right">
                                        <span style="font-size:12px;color:#71717a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">Reply</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
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

════════════════════════════════════════════════════
ridwaanhall.com · Reply notification
`;
