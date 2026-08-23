/**
 * HTML escaping for email bodies.
 *
 * Split out so `layout.ts` and `render.ts` share one definition and neither
 * imports the other. Quotes are escaped too, not just angle brackets: these
 * values land in HTML attributes as well as in text.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Escape, then turn newlines into `<br>`.
 *
 * The **only** place raw text becomes markup in an email. Escaping first is
 * what makes that safe: a message carrying `<img src=x onerror=…>` renders as
 * the characters someone typed.
 */
export function messageHtml(value: string): string {
  return escapeHtml(value).replace(/\n/g, "<br>");
}
