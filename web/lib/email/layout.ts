import { escapeHtml } from "@/lib/email/escape";

/**
 * The shell every transactional email is built from.
 *
 * **One layout, not five templates.** The Django originals were five
 * hand-maintained HTML files, 62KB of near-identical table markup that had to be
 * edited in step or drift apart -- the same duplication this port has been
 * removing everywhere else. Composing from typed pieces means a change to the
 * header, the card or the footer happens once.
 *
 * **The palette is the site's light theme**, not the old dark one. Values come
 * straight from the `html[data-theme="light"]` block in `static/css/input.css`,
 * converted from oklch because no mail client supports it:
 *
 *   canvas   #ffffff   `black`     the page ground
 *   card     #f7f7f7   `zinc-950`  the panel on it
 *   inset    #f0f0f1   `zinc-900`  a block within the panel
 *   border   #d0d0d3   `zinc-700`
 *   heading  #18181b   `zinc-100`
 *   body     #3f3f46   `zinc-300`
 *   muted    #52525c   `zinc-400`
 *   accent   #4f39f6   `indigo-500`  solid fills, white text on top
 *   link     #372aac   `indigo-400`  accent text on a light ground
 *
 * The surface order matters and is the site's: canvas is lightest, then the
 * card, then anything inset in it. `input.css` records why those four are
 * hand-tuned rather than mirrored -- in dark they spread across a wide range
 * above black, and in light they have only a few points of room below white.
 *
 * Everything is tables and inline styles because that is what mail clients
 * render. `<div>` layout, `class`, flexbox and grid are all unreliable in
 * Outlook, and a stylesheet in `<head>` is stripped by Gmail.
 */

/** The one font stack, repeated inline because mail clients need it per element. */
const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const PALETTE = {
  canvas: "#ffffff",
  card: "#f7f7f7",
  inset: "#f0f0f1",
  border: "#d0d0d3",
  borderSoft: "#e8e8e9",
  heading: "#18181b",
  body: "#3f3f46",
  muted: "#52525c",
  accent: "#4f39f6",
  link: "#372aac",
  onAccent: "#ffffff",
} as const;

/** A labelled row in the details block. */
export type Field = { label: string; value: string; href?: string };

/**
 * Wrap content in the site's email chrome.
 *
 * `preheader` is the line a mail client shows in the message list beside the
 * subject. Left out, clients take whatever text comes first -- usually the
 * brand name -- which wastes the one line of context the reader gets before
 * opening.
 */
export function shell({
  title,
  preheader,
  eyebrow,
  content,
}: {
  title: string;
  preheader: string;
  /** The short label at the top right, e.g. "New Message". */
  eyebrow: string;
  content: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${PALETTE.canvas};font-family:${FONT};-webkit-font-smoothing:antialiased;">
<div style="display:none;font-size:1px;color:${PALETTE.canvas};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</div>
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="${PALETTE.canvas}">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;background:${PALETTE.card};border:1px solid ${PALETTE.border};border-radius:12px;overflow:hidden;">
${header(eyebrow)}
<tr><td style="padding:28px 24px 4px;">
${content}
</td></tr>
${footer()}
</table>
</td></tr>
</table>
</body>
</html>`;
}

function header(eyebrow: string): string {
  return `<tr><td style="border-bottom:1px solid ${PALETTE.borderSoft};padding:16px 24px;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
<tr>
<td valign="middle">
<table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr>
<td bgcolor="${PALETTE.accent}" width="26" style="width:26px;height:26px;border-radius:13px;text-align:center;vertical-align:middle;line-height:26px;">
<span style="color:${PALETTE.onAccent};font-size:13px;font-weight:700;font-family:${FONT};">R</span>
</td>
<td style="padding-left:10px;vertical-align:middle;">
<span style="color:${PALETTE.heading};font-size:14px;font-weight:600;font-family:${FONT};">ridwaanhall.com</span>
</td>
</tr></table>
</td>
<td align="right" valign="middle">
<span style="color:${PALETTE.muted};font-size:12px;font-family:${FONT};">${escapeHtml(eyebrow)}</span>
</td>
</tr>
</table>
</td></tr>`;
}

function footer(): string {
  return `<tr><td style="border-top:1px solid ${PALETTE.borderSoft};padding:18px 24px;">
<p style="margin:0;font-size:12px;line-height:1.6;color:${PALETTE.muted};font-family:${FONT};">
Sent by <a href="https://ridwaanhall.com" style="color:${PALETTE.link};text-decoration:none;">ridwaanhall.com</a>
</p>
</td></tr>`;
}

/** A leading sentence. `html` is already-escaped markup, not raw user text. */
export function lede(html: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${PALETTE.body};font-family:${FONT};">${html}</p>`;
}

export function heading(text: string): string {
  return `<h1 style="margin:0 0 12px;font-size:19px;line-height:1.4;font-weight:600;color:${PALETTE.heading};font-family:${FONT};">${escapeHtml(text)}</h1>`;
}

/** Emphasis inside a `lede`, for a name or a value worth picking out. */
export function strong(text: string): string {
  return `<strong style="color:${PALETTE.heading};font-weight:600;">${escapeHtml(text)}</strong>`;
}

/** The label/value block: who wrote in, when, from where. */
export function fields(rows: Field[]): string {
  const body = rows
    .map(
      (row, index) => `<tr>
<td style="padding:${index === 0 ? "12px" : "8px"} 0 ${index === rows.length - 1 ? "12px" : "8px"};vertical-align:top;width:96px;">
<span style="font-size:12px;line-height:1.5;color:${PALETTE.muted};font-family:${FONT};">${escapeHtml(row.label)}</span>
</td>
<td style="padding:${index === 0 ? "12px" : "8px"} 0 ${index === rows.length - 1 ? "12px" : "8px"};vertical-align:top;">
<span style="font-size:13px;line-height:1.5;color:${PALETTE.heading};font-family:${FONT};word-break:break-word;">${
        row.href
          ? `<a href="${escapeHtml(row.href)}" style="color:${PALETTE.link};text-decoration:none;">${escapeHtml(row.value)}</a>`
          : escapeHtml(row.value)
      }</span>
</td>
</tr>`,
    )
    .join("\n");

  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 18px;background:${PALETTE.inset};border:1px solid ${PALETTE.borderSoft};border-radius:10px;">
<tr><td style="padding:2px 14px;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
${body}
</table>
</td></tr>
</table>`;
}

/**
 * A quoted message.
 *
 * `messageHtml` is escaped-and-`<br>`-joined by the caller, which is the one
 * place raw text becomes markup — see `lib/email/escape.ts`.
 */
export function quote({ label, messageHtml }: { label?: string; messageHtml: string }): string {
  const caption = label
    ? `<p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.02em;text-transform:uppercase;color:${PALETTE.muted};font-family:${FONT};">${escapeHtml(label)}</p>`
    : "";

  return `${caption}<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 18px;">
<tr>
<td width="3" bgcolor="${PALETTE.accent}" style="width:3px;border-radius:2px;font-size:0;line-height:0;">&nbsp;</td>
<td style="padding-left:14px;">
<div style="font-size:15px;line-height:1.7;color:${PALETTE.body};font-family:${FONT};word-break:break-word;">${messageHtml}</div>
</td>
</tr>
</table>`;
}

/** The single call to action. Bulletproof enough for Outlook's table renderer. */
export function button({ href, label }: { href: string; label: string }): string {
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;">
<tr><td bgcolor="${PALETTE.accent}" style="border-radius:8px;">
<a href="${escapeHtml(href)}" style="display:inline-block;padding:11px 20px;font-size:14px;font-weight:600;color:${PALETTE.onAccent};text-decoration:none;font-family:${FONT};border-radius:8px;">${escapeHtml(label)}</a>
</td></tr>
</table>`;
}

/** A closing aside, smaller and quieter than the body. */
export function note(html: string): string {
  return `<p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:${PALETTE.muted};font-family:${FONT};">${html}</p>`;
}
