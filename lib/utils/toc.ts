import { slugify } from "@/lib/utils/format";
import { plainText } from "@/lib/utils/plain-text";
import { sanitizeRichText } from "@/lib/utils/sanitize";

export type Heading = {
  /** The anchor. Generated here, never stored. */
  id: string;
  /** What the entry reads as -- the heading with any markup stripped. */
  text: string;
  level: 2 | 3;
};

/**
 * An article, and the list of places inside it worth linking to.
 *
 * **Both halves come out of one pass, after sanitising.** The ids are injected
 * into the *sanitised* HTML rather than the stored HTML, which is what makes
 * them ours: `lib/utils/sanitize.ts` allows `id` on no element at all, so
 * anything that arrives in the content is already gone by the time this runs
 * and cannot collide with, or impersonate, an anchor the page depends on.
 *
 * **Derived rather than stored.** An id in the database would be a structural
 * identifier living in author-typed text, where rewording a heading silently
 * breaks every link anybody ever made to it -- the same shape of bug as keying
 * a colour on a label rather than on a slug. Deriving it costs one pass over a
 * string on a route that prerenders every slug anyway.
 *
 * Only `h2` and `h3`. `h4` and below are subdivisions of a point rather than
 * points, and a contents list that includes them stops being scannable, which
 * is the only thing it is for.
 */
export function prepareArticle(html: string): { html: string; headings: Heading[] } {
  const safe = sanitizeRichText(html);
  const headings: Heading[] = [];
  const used = new Set<string>();

  const withIds = safe.replace(
    /<(h[23])(\s[^>]*)?>([\s\S]*?)<\/\1>/gi,
    (whole, tag: string, attrs: string | undefined, inner: string) => {
      const text = plainText(inner).trim();
      if (!text) return whole;

      // A heading of only punctuation or of a script this slugifier strips
      // leaves nothing to build an anchor from. Numbering it keeps every entry
      // addressable without inventing words for it.
      const base = slugify(text) || `section-${headings.length + 1}`;

      // Two headings can read the same and still be different places.
      let id = base;
      for (let n = 2; used.has(id); n += 1) id = `${base}-${n}`;
      used.add(id);

      headings.push({ id, text, level: tag.toLowerCase() === "h2" ? 2 : 3 });
      return `<${tag}${attrs ?? ""} id="${id}">${inner}</${tag}>`;
    },
  );

  return { html: withIds, headings };
}
