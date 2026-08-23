import sanitizeHtml from "sanitize-html";

/**
 * Sanitise stored rich-text HTML before it is rendered.
 *
 * The body of a post is HTML from the database, rendered through
 * `dangerouslySetInnerHTML`. Today the only writer is the admin, so this is not
 * guarding against a hostile author -- it is guarding against the *next* change:
 * a paste from Word carrying `<script>`, an import from another system, or a
 * future editor that stops escaping something it used to.
 *
 * The allow-list is exactly the vocabulary the content uses and the editor can
 * produce. Anything outside it is dropped rather than escaped, so a stray tag
 * disappears instead of appearing as visible angle brackets.
 */

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr",
    "h2", "h3", "h4", "h5", "h6",
    "strong", "em", "s", "u", "code", "mark", "sub", "sup",
    "ul", "ol", "li",
    "blockquote", "pre",
    "a", "img",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    // `language-…` is the convention every syntax highlighter reads, and it is
    // what the code-block editor round-trips. It is the one class allowed
    // through: appearance comes from styles/prose.css, not from the content.
    code: ["class"],
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
  },
  allowedClasses: {
    code: [/^language-[\w-]+$/],
  },
  // http(s) and mailto only -- notably not `javascript:`, which is the classic
  // way an anchor becomes script execution.
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  transformTags: {
    // Any link leaving the site opens in a new tab, and carries the `rel` that
    // should always accompany `target="_blank"` -- without `noopener` the new
    // page gets a handle on `window.opener`.
    a: (tagName, attribs) => {
      return {
        tagName,
        attribs: isExternal(attribs.href ?? "")
          ? { ...attribs, target: "_blank", rel: "noopener noreferrer" }
          : attribs,
      };
    },
  },
};

/**
 * The site's own host, and every subdomain of it.
 *
 * Written out rather than read from `NEXT_PUBLIC_BASE_URL` on purpose. An unset
 * or mistyped variable would not fail here, it would quietly reclassify every
 * link on the site -- and this decides an attribute on stored content that a
 * visitor supplied. A constant is wrong in one obvious way or not at all.
 */
const SITE_HOST = "ridwaanhall.com";

/**
 * Is this link somebody else's?
 *
 * **Parsed, never searched.** This was
 * `href.includes("ridwaanhall.com")`, which asks whether the site's name
 * appears anywhere in the string -- and it appears in
 * `https://ridwaanhall.com.evil.test/` (a different registrable domain), in
 * `https://evil.test/?ref=ridwaanhall.com` (a query parameter), and in
 * `https://notridwaanhall.com/` (a longer name). All three were treated as our
 * own and lost their `target="_blank"` and the `rel` that goes with it.
 *
 * Anything that is not an absolute http(s) URL is ours: a relative href stays
 * in the tab it was clicked in, and `mailto:` opens no tab at all.
 */
function isExternal(href: string): boolean {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  const host = url.hostname.toLowerCase();
  // The dot matters. Without it `notridwaanhall.com` ends with the site's name
  // and this is the substring bug again, one level further in.
  return host !== SITE_HOST && !host.endsWith(`.${SITE_HOST}`);
}

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html ?? "", OPTIONS);
}
