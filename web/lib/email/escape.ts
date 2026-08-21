/**
 * HTML escaping for email bodies.
 *
 * Split out so `layout.ts` and `render.ts` share one definition and neither
 * imports the other. Matches Python's `html.escape` with its default
 * `quote=True`, which is what the Django originals used.
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
