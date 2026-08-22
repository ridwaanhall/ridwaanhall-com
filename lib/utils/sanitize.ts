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
      const href = attribs.href ?? "";
      const external = /^https?:\/\//i.test(href) && !href.includes("ridwaanhall.com");
      return {
        tagName,
        attribs: external
          ? { ...attribs, target: "_blank", rel: "noopener noreferrer" }
          : attribs,
      };
    },
  },
};

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html ?? "", OPTIONS);
}
