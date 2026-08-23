/**
 * The readable text of a rich-text body.
 *
 * Bodies are stored as HTML. Three things need the prose without the markup --
 * the site search, the meta description of a project, and the `wordCount` in a
 * post's JSON-LD -- and doing it in one place keeps the three from drifting
 * apart on what counts as the text of a body.
 *
 * Entities are decoded, because these strings end up somewhere that would show
 * them: a `<meta>` description reading "Rust &amp; Go" is a visible mistake in
 * a search result. Only the five named entities the sanitiser can emit are
 * handled, plus numeric ones -- this is not a general-purpose HTML parser and
 * should not grow into one.
 */
const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

export function plainText(html: string): string {
  return (html ?? "")
    // A block-level tag is a word boundary: without this, "<p>one</p><p>two</p>"
    // collapses to "onetwo" and neither word is findable.
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:amp|lt|gt|quot|#39|apos|nbsp);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}
