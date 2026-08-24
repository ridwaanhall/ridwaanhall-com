import { escapeHtml } from "@/lib/email/escape";

/**
 * The shell every transactional email is built from.
 *
 * **One layout, not five templates.** Five hand-maintained HTML files is 62KB
 * of near-identical table markup that has to be edited in step or drift apart.
 * Composing from typed pieces means a change to the header, the card or the
 * footer happens once.
 *
 * **The palettes are the site's, both of them.** Values come from the two
 * halves of `app/globals.css`: `DARK` is the untouched Tailwind zinc/indigo
 * ramp the site runs by default, `LIGHT` the `html[data-theme="light"]` remap,
 * converted from oklch because no mail client supports it.
 *
 *   role      light      dark       token
 *   canvas    #ffffff    #000000    the page ground
 *   card      #f7f7f7    #09090b    the panel on it
 *   inset     #f0f0f1    #18181b    a block within the panel
 *   border    #d0d0d3    #3f3f46    `zinc-700`
 *   heading   #18181b    #ffffff
 *   body      #3f3f46    #d4d4d8    `zinc-300`
 *   muted     #52525c    #9f9fa9    `zinc-400`
 *   accent    #4f39f6    #615fff    `indigo-500`, the brand mark
 *   link      #372aac    #7c86ff    `indigo-400`
 *   action    #18181b    #ffffff    the one button: contrast, not colour
 *
 * The surface order matters and is the site's: canvas is the extreme, then the
 * card, then anything inset in it. `globals.css` records why those are
 * hand-tuned rather than mirrored -- in dark they spread across a wide range
 * above black, and in light they have only a few points of room below white.
 *
 * **Light is what is written inline; dark is an overlay.** Every element
 * carries its light value as an inline style *and* a class, and one `<style>`
 * block repaints the classes under `prefers-color-scheme: dark`. The ordering
 * is the whole point: a client that drops the stylesheet -- Gmail clipping a
 * long message, Outlook, a text-only proxy -- still renders a complete, correct
 * email rather than a half-themed one. Nothing but colour lives in that block,
 * so it can never become load-bearing. `scripts/check-emails.mjs` proves both
 * halves.
 *
 * `!important` on every override is not decoration: an inline style outranks a
 * class selector, so without it the entire dark theme is dead markup.
 *
 * Everything is tables and inline styles because that is what mail clients
 * render. `<div>` layout, flexbox and grid are all unreliable in Outlook, and a
 * stylesheet carrying *layout* would be the thing Gmail strips.
 */

/** The one font stack, repeated inline because mail clients need it per element. */
const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const LIGHT = {
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
  action: "#18181b",
  onAction: "#ffffff",
} as const;

export const DARK = {
  canvas: "#000000",
  card: "#09090b",
  inset: "#18181b",
  border: "#3f3f46",
  borderSoft: "#27272a",
  heading: "#ffffff",
  body: "#d4d4d8",
  muted: "#9f9fa9",
  accent: "#615fff",
  link: "#7c86ff",
  onAccent: "#ffffff",
  action: "#ffffff",
  onAction: "#18181b",
} as const;

/**
 * The role pills.
 *
 * Flat fills, unlike the site's gradients: no mail client renders a gradient
 * reliably, and a failed one falls back to transparent -- light text on
 * nothing. Both are dark chips with light text, which reads correctly against
 * either palette, so neither needs a dark override.
 */
const BADGE = {
  author: { bg: "#4c1d95", fg: "#f5f3ff", label: "Author" },
  coAuthor: { bg: "#a16207", fg: "#fffbeb", label: "Co-author" },
} as const;

export type BadgeTone = keyof typeof BADGE;

/** A labelled row in the details block. */
export type Field = { label: string; value: string; href?: string; badge?: BadgeTone };

/**
 * The dark overlay.
 *
 * Colour only -- background, border-colour, colour. Anything structural in here
 * would break the client that strips it, which is the one case this whole
 * arrangement exists to survive. `[data-ogsc]` is Outlook.com's own dark-mode
 * hook: it rewrites the document and drops the media query, so the same rules
 * are repeated under it.
 */
function darkOverlay(): string {
  const rules: [string, string][] = [
    [".e-canvas", `background:${DARK.canvas} !important;`],
    [".e-card", `background:${DARK.card} !important;border-color:${DARK.border} !important;`],
    [".e-inset", `background:${DARK.inset} !important;border-color:${DARK.borderSoft} !important;`],
    [".e-outline", `border-color:${DARK.borderSoft} !important;`],
    [".e-rule", `border-color:${DARK.borderSoft} !important;`],
    [".e-head", `color:${DARK.heading} !important;`],
    [".e-body", `color:${DARK.body} !important;`],
    [".e-muted", `color:${DARK.muted} !important;`],
    [".e-link", `color:${DARK.link} !important;`],
    [".e-mark", `background:${DARK.accent} !important;`],
    [".e-action", `background:${DARK.action} !important;`],
    [".e-action-text", `color:${DARK.onAction} !important;`],
  ];

  const block = (prefix: string) =>
    rules.map(([selector, body]) => `${prefix}${selector}{${body}}`).join("");

  return `@media (prefers-color-scheme:dark){${block("")}}${block("[data-ogsc] ")}`;
}

/**
 * Wrap content in the site's email chrome.
 *
 * `preheader` is the line a mail client shows in the message list beside the
 * subject. Left out, clients take whatever text comes first -- usually the
 * brand name -- which wastes the one line of context the reader gets before
 * opening.
 *
 * `eyebrow` is the small label above the headline. It used to sit opposite the
 * wordmark in the header; above the heading it reads as a kicker, and leaves
 * the header carrying nothing but the brand.
 */
export function shell({
  title,
  preheader,
  eyebrow,
  content,
}: {
  title: string;
  preheader: string;
  /** The short label above the heading, e.g. "New message". */
  eyebrow: string;
  content: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(title)}</title>
<style>${darkOverlay()}</style>
</head>
<body class="e-canvas" style="margin:0;padding:0;background:${LIGHT.canvas};font-family:${FONT};-webkit-font-smoothing:antialiased;">
<div style="display:none;font-size:1px;color:${LIGHT.canvas};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</div>
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="e-canvas" bgcolor="${LIGHT.canvas}" style="background:${LIGHT.canvas};">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="e-card" style="max-width:640px;background:${LIGHT.card};border:1px solid ${LIGHT.border};border-radius:12px;overflow:hidden;">
${header()}
<tr><td style="padding:28px 26px 8px;">
${kicker(eyebrow)}
${content}
</td></tr>
${footer()}
</table>
</td></tr>
</table>
</body>
</html>`;
}

function header(): string {
  return `<tr><td class="e-rule" style="border-bottom:1px solid ${LIGHT.borderSoft};padding:18px 26px;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr>
<td class="e-mark" bgcolor="${LIGHT.accent}" width="28" style="width:28px;height:28px;background:${LIGHT.accent};border-radius:14px;text-align:center;vertical-align:middle;line-height:28px;">
<span style="color:${LIGHT.onAccent};font-size:13px;font-weight:700;font-family:${FONT};">R</span>
</td>
<td style="padding-left:11px;vertical-align:middle;">
<span class="e-head" style="color:${LIGHT.heading};font-size:14px;font-weight:600;letter-spacing:-0.01em;font-family:${FONT};">ridwaanhall.com</span>
</td>
</tr></table>
</td></tr>`;
}

function footer(): string {
  return `<tr><td class="e-rule" style="border-top:1px solid ${LIGHT.borderSoft};padding:18px 26px;">
<p class="e-muted" style="margin:0;font-size:12px;line-height:1.6;color:${LIGHT.muted};font-family:${FONT};">
Sent by <a class="e-link" href="https://ridwaanhall.com" style="color:${LIGHT.link};text-decoration:none;">ridwaanhall.com</a>
</p>
</td></tr>`;
}

/** The small uppercase label above a heading, and above a quote. */
function kicker(text: string, gap = "10px"): string {
  return `<p class="e-muted" style="margin:0 0 ${gap};font-size:11px;font-weight:600;letter-spacing:0.09em;text-transform:uppercase;color:${LIGHT.muted};font-family:${FONT};">${escapeHtml(text)}</p>`;
}

/** A leading sentence. `html` is already-escaped markup, not raw user text. */
export function lede(html: string): string {
  return `<p class="e-body" style="margin:0 0 22px;font-size:15px;line-height:1.65;color:${LIGHT.body};font-family:${FONT};">${html}</p>`;
}

export function heading(text: string): string {
  return `<h1 class="e-head" style="margin:0 0 12px;font-size:20px;line-height:1.35;font-weight:600;letter-spacing:-0.01em;color:${LIGHT.heading};font-family:${FONT};">${escapeHtml(text)}</h1>`;
}

/** Emphasis inside a `lede`, for a name or a value worth picking out. */
export function strong(text: string): string {
  return `<strong class="e-head" style="color:${LIGHT.heading};font-weight:600;">${escapeHtml(text)}</strong>`;
}

/** A role pill, for the guestbook's authors and co-authors. */
export function badge(tone: BadgeTone): string {
  const { bg, fg, label } = BADGE[tone];
  return `<span style="display:inline-block;background:${bg};color:${fg};font-size:10px;font-weight:600;letter-spacing:0.04em;line-height:1;padding:4px 8px;border-radius:9px;margin-left:8px;font-family:${FONT};">${label}</span>`;
}

/**
 * The label/value block: who wrote in, when, from where.
 *
 * Hairline rules between the rows rather than a filled panel. The message is
 * then the only filled block in the card, which is what makes it read as the
 * thing being shown rather than one panel among several.
 */
export function fields(rows: Field[]): string {
  const body = rows
    .map((row, index) => {
      const first = index === 0;
      const last = index === rows.length - 1;
      const padding =
        rows.length === 1 ? "0" : first ? "0 0 11px" : last ? "11px 0 0" : "11px 0";
      const rule = first ? "" : `border-top:1px solid ${LIGHT.borderSoft};`;
      const cell = `padding:${padding};${rule}vertical-align:top;`;
      const ruleClass = first ? "" : " e-rule";

      const value = row.href
        ? `<a class="e-link" href="${escapeHtml(row.href)}" style="font-size:13px;line-height:1.5;color:${LIGHT.link};text-decoration:none;font-family:${FONT};word-break:break-word;">${escapeHtml(row.value)}</a>`
        : `<span class="e-head" style="font-size:13px;line-height:1.5;color:${LIGHT.heading};font-family:${FONT};word-break:break-word;">${escapeHtml(row.value)}</span>`;

      return `<tr>
<td width="92" class="e-cell${ruleClass}" style="width:92px;${cell}">
<span class="e-muted" style="font-size:12px;line-height:1.5;color:${LIGHT.muted};font-family:${FONT};">${escapeHtml(row.label)}</span>
</td>
<td class="e-cell${ruleClass}" style="${cell}">${value}${row.badge ? badge(row.badge) : ""}</td>
</tr>`;
    })
    .join("\n");

  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 22px;">
${body}
</table>`;
}

/**
 * A quoted message.
 *
 * `messageHtml` is escaped-and-`<br>`-joined by the caller, which is the one
 * place raw text becomes markup -- see `lib/email/escape.ts`.
 *
 * `tone: "quiet"` is the outlined variant, for the message being *answered* in
 * a reply notification. Two identical blocks would leave the reader working out
 * which of them is the new thing.
 */
export function quote({
  label,
  messageHtml,
  tone = "filled",
}: {
  label?: string;
  messageHtml: string;
  tone?: "filled" | "quiet";
}): string {
  const caption = label ? kicker(label, "8px") : "";

  const surface =
    tone === "filled"
      ? `class="e-inset" style="margin:0 0 22px;background:${LIGHT.inset};border:1px solid ${LIGHT.borderSoft};border-radius:12px;"`
      : `class="e-outline" style="margin:0 0 22px;border:1px solid ${LIGHT.borderSoft};border-radius:12px;"`;

  const inner = tone === "filled" ? "padding:16px 18px;" : "padding:14px 18px;";

  const text =
    tone === "filled"
      ? `class="e-body" style="font-size:15px;line-height:1.7;color:${LIGHT.body};`
      : `class="e-muted" style="font-size:14px;line-height:1.65;color:${LIGHT.muted};`;

  return `${caption}<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" ${surface}>
<tr><td style="${inner}">
<div ${text}font-family:${FONT};word-break:break-word;">${messageHtml}</div>
</td></tr>
</table>`;
}

/**
 * The single call to action. Bulletproof enough for Outlook's table renderer.
 *
 * Neutral, not accent: the indigo is spent on the brand mark and the links, so
 * the button carries contrast instead of colour and stays the one obvious
 * action. It inverts with the theme -- near-black on light, near-white on dark.
 */
export function button({ href, label }: { href: string; label: string }): string {
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:2px 0 22px;">
<tr><td class="e-action" bgcolor="${LIGHT.action}" style="background:${LIGHT.action};border-radius:8px;">
<a class="e-action-text" href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:${LIGHT.onAction};text-decoration:none;font-family:${FONT};border-radius:8px;">${escapeHtml(label)}</a>
</td></tr>
</table>`;
}

/** A closing aside, smaller and quieter than the body. */
export function note(html: string): string {
  return `<p class="e-muted" style="margin:0 0 22px;font-size:13px;line-height:1.6;color:${LIGHT.muted};font-family:${FONT};">${html}</p>`;
}
