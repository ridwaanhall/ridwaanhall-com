/**
 * A post's outline: its second- and third-level headings, each given an id a
 * link can land on.
 *
 * It runs on *sanitised* HTML, which is what makes a pattern safe here: the
 * sanitiser allows no attributes on a heading, so every one arrives as a bare
 * `<h2>` or `<h3>` and nothing else can look like one. The ids are prefixed so
 * a heading called "Comments" cannot collide with the page's own sections.
 */

export type OutlineEntry = { id: string; label: string; level: 2 | 3 };

const HEADING = /<(h[23])>([\s\S]*?)<\/\1>/g;

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " };

function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, name: string) => ENTITIES[name])
    .replace(/\s+/g, " ")
    .trim();
}

function slug(label: string): string {
  return (
    label
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "section"
  );
}

export function outlineHtml(html: string): { html: string; headings: OutlineEntry[] } {
  const headings: OutlineEntry[] = [];
  const seen = new Map<string, number>();
  const out = html.replace(HEADING, (whole, tag: string, inner: string) => {
    const label = text(inner);
    if (!label) return whole;
    const base = `s-${slug(label)}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const id = count ? `${base}-${count + 1}` : base;
    headings.push({ id, label, level: tag === "h2" ? 2 : 3 });
    return `<${tag} id="${id}">${inner}</${tag}>`;
  });
  return { html: out, headings };
}
