/**
 * Stored rich-text HTML to Markdown.
 *
 * Post bodies and project descriptions are stored as HTML that
 * `lib/utils/sanitize.ts` has already reduced to a short list of tags -- no
 * attributes but a link's `href`, an image's `src` and `alt`, and a code
 * block's `language-*` class -- so converting means handling that list and
 * nothing else, and whatever remains is stripped rather than guessed at.
 *
 * Pure, so `npm test` covers it without a database.
 */

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#x27;": "'",
};

const decode = (text: string) => text.replace(/&(nbsp|amp|lt|gt|quot|#39|#x27);/g, (entity) => ENTITIES[entity] ?? entity);

/*
 * Repeated until nothing changes: a tag with another tag inside its text can
 * survive one pass. A loop to a fixed point is complete by construction.
 */
function stripTags(html: string): string {
  let previous: string;
  let current = html;
  do {
    previous = current;
    current = current.replace(/<[^>]*>/g, "");
  } while (current !== previous);
  return current;
}

const inline = (html: string) => stripTags(html).replace(/\s+/g, " ").trim();

export function htmlToMarkdown(html: string | null | undefined): string {
  if (!html) return "";
  let s = html.replace(/\r/g, "");

  // Code first, so what is inside it is never read as markup.
  const blocks: string[] = [];
  s = s.replace(/<pre[^>]*>\s*<code(?: class="language-([\w-]+)")?[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/g, (_, language: string | undefined, code: string) => {
    blocks.push("```" + (language ?? "") + "\n" + decode(stripTags(code)).replace(/\n$/, "") + "\n```");
    return `\n\n@@CODE${blocks.length - 1}@@\n\n`;
  });

  s = s.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g, (_, level: string, text: string) => `\n\n${"#".repeat(Math.max(2, Number(level)))} ${inline(text)}\n\n`);
  s = s.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/g, (_, text: string) =>
    "\n\n" + htmlToMarkdown(text).split("\n").map((line) => `> ${line}`.trimEnd()).join("\n") + "\n\n",
  );
  s = s.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/g, (_, items: string) => {
    let n = 0;
    return "\n\n" + items.replace(/<li[^>]*>([\s\S]*?)<\/li>/g, (__, item: string) => `${++n}. ${inlineMarkdown(item)}\n`) + "\n";
  });
  s = s.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/g, (_, items: string) => "\n\n" + items.replace(/<li[^>]*>([\s\S]*?)<\/li>/g, (__, item: string) => `- ${inlineMarkdown(item)}\n`) + "\n");
  s = s.replace(/<hr\s*\/?>/g, "\n\n---\n\n");
  s = s.replace(/<\/p>/g, "\n\n").replace(/<p[^>]*>/g, "");
  s = inlineMarkdown(s, true);

  return s
    .replace(/@@CODE(\d+)@@/g, (_, i: string) => blocks[Number(i)])
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Emphasis, code, links and images, then every other tag removed. */
function inlineMarkdown(html: string, keepBreaks = false): string {
  let s = html;
  s = s.replace(/<(strong|b)>([\s\S]*?)<\/\1>/g, "**$2**").replace(/<(em|i)>([\s\S]*?)<\/\1>/g, "_$2_");
  s = s.replace(/<code[^>]*>([\s\S]*?)<\/code>/g, (_, code: string) => `\`${decode(stripTags(code))}\``);
  s = s.replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (_, href: string, text: string) => `[${inline(text)}](${decode(href)})`);
  s = s.replace(/<img [^>]*?(?:alt="([^"]*)"[^>]*?src="([^"]+)"|src="([^"]+)"[^>]*?alt="([^"]*)")[^>]*>/g, (_, a1?: string, s1?: string, s2?: string, a2?: string) => `![${decode(a1 ?? a2 ?? "")}](${s1 ?? s2})`);
  s = s.replace(/<br\s*\/?>/g, keepBreaks ? "  \n" : " ");
  // What was a tag is gone; text is decoded last, so an escaped angle bracket
  // in a post is not read back as one.
  const text = decode(stripTags(s));
  return keepBreaks ? text : text.replace(/\s+/g, " ").trim();
}
