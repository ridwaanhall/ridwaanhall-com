/**
 * Convert the JSONB content blocks to rich-text HTML.
 *
 * The blog body was authored as an array of blocks, each carrying a `type` and
 * a hand-typed Tailwind `class`. That put layout decisions in the content: 179
 * paragraphs each repeating "mb-4 text-sm md:text-base lg:text-lg", and a
 * heading whose spacing could only be changed by editing 79 rows. This
 * converts that to plain semantic HTML and lets a stylesheet do the styling.
 *
 * Every class is dropped. Where a class carried *meaning* rather than
 * appearance, it becomes the mark that actually means it:
 *
 *   <span class='font-mono …'>x</span>  ->  <code>x</code>
 *       Those are code samples. `font-mono` was the author saying so.
 *   <span class='text-red-600'>x</span> ->  <strong>x</strong>
 *       Colour used purely as emphasis becomes emphasis.
 *   <a class='text-green-400 …'>        ->  <a>
 *       Link colour differed per post (green in one, blue in another);
 *       the prose stylesheet gives every link one appearance.
 *
 * The source column is never modified -- the HTML goes into a new one -- so
 * this is reversible and the old rendering stays available for comparison.
 *
 *   node scripts/blocks-to-html.mjs            # dry run: report only
 *   node scripts/blocks-to-html.mjs --sample   # dry run + full before/after for one post
 *   node scripts/blocks-to-html.mjs --apply    # write content_html / description_html
 */
import { pathToFileURL } from "node:url";

import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local", quiet: true });

const APPLY = process.argv.includes("--apply");
const SAMPLE = process.argv.includes("--sample");

// ---------------------------------------------------------------------------
// Inline conversion
// ---------------------------------------------------------------------------

/** Attribute value from an attribute string, either quote style. */
function attr(attrs, name) {
  const m = new RegExp(`${name}\\s*=\\s*(['"])(.*?)\\1`, "i").exec(attrs);
  return m ? m[2] : null;
}

/**
 * Rewrite the inline HTML inside a text value.
 *
 * Runs innermost-first by repeatedly replacing spans that contain no further
 * span, so nesting cannot leave a stray tag behind.
 */
export function convertInline(html) {
  let out = String(html ?? "");

  // <span class='…'>…</span>
  for (let pass = 0; pass < 10; pass++) {
    const before = out;
    out = out.replace(/<span([^>]*)>((?:(?!<span)[\s\S])*?)<\/span>/gi, (_all, attrs, inner) => {
      const cls = (attr(attrs, "class") ?? "").trim();
      if (!cls) return inner;
      // `font-mono` marks a code sample; that is a meaning, not a look.
      if (/\bfont-mono\b/.test(cls)) return `<code>${inner}</code>`;
      // Anything else here is colour or weight used as emphasis.
      return `<strong>${inner}</strong>`;
    });
    if (out === before) break;
  }

  // <a href='…' class='…' target='…'> -- keep the destination, drop the styling.
  out = out.replace(/<a([^>]*)>/gi, (_all, attrs) => {
    const href = attr(attrs, "href");
    if (!href) return "<a>";
    // External links keep opening in a new tab, with the rel that should
    // always have accompanied target="_blank".
    const external = /^https?:\/\//i.test(href) && !href.includes("ridwaanhall.com");
    return external
      ? `<a href="${href}" target="_blank" rel="noopener noreferrer">`
      : `<a href="${href}">`;
  });

  // Strip any remaining class attribute (belt and braces).
  out = out.replace(/\s+class\s*=\s*(['"]).*?\1/gi, "");

  // <br> -> <br /> so the output is well-formed.
  out = out.replace(/<br\s*\/?>/gi, "<br />");

  return out.trim();
}

// ---------------------------------------------------------------------------
// Block conversion
// ---------------------------------------------------------------------------

const HEADINGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

export function blockToHtml(block) {
  const type = String(block?.type ?? "p").toLowerCase();
  const text = () => convertInline(block.text);

  if (HEADINGS.has(type)) return `<${type}>${text()}</${type}>`;
  if (type === "p" || type === "div" || type === "span") return `<p>${text()}</p>`;
  if (type === "blockquote") return `<blockquote>${text()}</blockquote>`;

  // `pre` and `code` are both code samples; <pre><code> is the pairing every
  // renderer and every editor understands.
  //
  // The stored text is sometimes *already* wrapped in `<code class="language-…">`
  // -- the author hand-wrote the inner tag as well as choosing the block type.
  // Escaping that verbatim would print the tag on the page as literal text, so
  // the wrapper is unwrapped first and its language carried onto the `<code>`
  // we emit. `language-python` is kept deliberately: unlike the Tailwind
  // classes this conversion strips, it is metadata rather than appearance, it
  // is the convention every highlighter reads, and it is what Tiptap's code
  // block round-trips.
  if (type === "pre" || type === "code") {
    const raw = String(block.text ?? "");
    const wrapped = /^\s*<code([^>]*)>([\s\S]*)<\/code>\s*$/i.exec(raw);
    const body = wrapped ? wrapped[2] : raw;

    // A `code` block is a one-line snippet, and the renderer emitted a bare
    // `<code>` for it -- inline, sitting between paragraphs. A `pre` block is a
    // real multi-line listing. Keeping that distinction matters: promoting the
    // one `code` block to a `<pre>` would put a grey slab in the middle of a
    // page that today reads as a line of monospace text.
    if (type === "code") {
      return `<p><code>${escapeText(body)}</code></p>`;
    }

    const language = wrapped ? /\blanguage-([\w-]+)/i.exec(attr(wrapped[1], "class") ?? "")?.[1] : null;
    const openTag = language ? `<code class="language-${language}">` : "<code>";
    return `<pre>${openTag}${escapeText(body)}</code></pre>`;
  }

  if (type === "ul" || type === "ol") {
    const items = (block.items ?? [])
      .map((item) => `<li>${convertInline(item?.text ?? item)}</li>`)
      .join("");
    return `<${type}>${items}</${type}>`;
  }

  if (type === "table") {
    const headers = (block.headers ?? []).map((h) => `<th>${convertInline(h)}</th>`).join("");
    const rows = (block.rows ?? [])
      .map((row) => `<tr>${(row ?? []).map((c) => `<td>${convertInline(c)}</td>`).join("")}</tr>`)
      .join("");
    return `<table>${headers ? `<thead><tr>${headers}</tr></thead>` : ""}<tbody>${rows}</tbody></table>`;
  }

  // Unknown type: keep the words rather than dropping the block.
  return `<p>${text()}</p>`;
}

/** Code samples are literal text -- angle brackets in them are not markup. */
function escapeText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function blocksToHtml(blocks) {
  return (blocks ?? []).map(blockToHtml).join("\n");
}

/** Project descriptions are a plain array of paragraph strings. */
export function stringsToHtml(strings) {
  return (strings ?? [])
    .filter((s) => String(s ?? "").trim())
    .map((s) => `<p>${convertInline(s)}</p>`)
    .join("\n");
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

// `pathToFileURL` rather than string-building the URL: on Windows argv[1] is a
// drive-letter path, the hand-rolled comparison silently never matches, and the
// script exits having printed nothing at all.
// The `process.argv[1]` guard covers being imported by a test or another
// script, where there is no entry path at all.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const url = new URL(process.env.STORAGE_POSTGRES_URL);
  url.searchParams.delete("sslmode");
  const pool = new pg.Pool({
    connectionString: url.toString(),
    max: 5,
    ssl: { rejectUnauthorized: false },
  });

  const { rows: posts } = await pool.query("select id, title, slug, content from blog_blogpost order by id");
  const { rows: projects } = await pool.query("select id, title, description from projects_project order by id");

  const stats = { blocks: 0, spansToCode: 0, spansToStrong: 0, linksCleaned: 0, classesDropped: 0 };
  const converted = { posts: [], projects: [] };

  for (const post of posts) {
    for (const b of post.content ?? []) {
      stats.blocks++;
      if (b.class) stats.classesDropped++;
      const texts = [b.text, ...(b.items ?? []).map((i) => i?.text), ...(b.rows ?? []).flat(), ...(b.headers ?? [])]
        .filter((t) => typeof t === "string");
      for (const t of texts) {
        for (const m of t.matchAll(/<span([^>]*)>/gi)) {
          const cls = attr(m[1], "class") ?? "";
          if (/\bfont-mono\b/.test(cls)) stats.spansToCode++;
          else if (cls.trim()) stats.spansToStrong++;
        }
        for (const m of t.matchAll(/<a([^>]*)>/gi)) if (attr(m[1], "class")) stats.linksCleaned++;
      }
    }
    converted.posts.push({ id: post.id, slug: post.slug, title: post.title, html: blocksToHtml(post.content) });
  }

  for (const project of projects) {
    converted.projects.push({ id: project.id, title: project.title, html: stringsToHtml(project.description) });
  }

  console.log(`${posts.length} posts / ${stats.blocks} blocks, ${projects.length} projects\n`);
  console.log("conversions:");
  console.log(`  ${String(stats.classesDropped).padStart(4)}  block class attributes dropped`);
  console.log(`  ${String(stats.spansToCode).padStart(4)}  <span class='font-mono …'>  ->  <code>`);
  console.log(`  ${String(stats.spansToStrong).padStart(4)}  <span class='text-…'>       ->  <strong>`);
  console.log(`  ${String(stats.linksCleaned).padStart(4)}  <a class='…'>               ->  <a> (styling from the stylesheet)`);

  const emptyPosts = converted.posts.filter((p) => !p.html.trim());
  const emptyProjects = converted.projects.filter((p) => !p.html.trim());
  console.log(`\n  posts producing empty HTML:    ${emptyPosts.length}`);
  console.log(`  projects producing empty HTML: ${emptyProjects.length}`);
  if (emptyProjects.length) console.log("   ", emptyProjects.map((p) => p.title).join(", "));

  // A crude but effective integrity check: the words must survive.
  let wordLoss = 0;
  for (const post of posts) {
    const before = JSON.stringify(post.content).replace(/<[^>]+>/g, " ");
    const after = converted.posts.find((p) => p.id === post.id).html.replace(/<[^>]+>/g, " ");
    const words = (s) => new Set(s.toLowerCase().match(/[a-z]{4,}/g) ?? []);
    const [a, b] = [words(before), words(after)];
    // Class names contribute words to `before` that should not be in `after`,
    // so only count words that vanished *and* are not Tailwind-looking.
    const lost = [...a].filter(
      (w) => !b.has(w) && !/^(text|font|list|disc|mono|semibold|italic|rounded|overflow|auto|zinc|blue|red|green|purple|yellow|white|indigo|teal|rose|orange|pink|class|type|items|rows|headers|true|false|null)$/.test(w),
    );
    if (lost.length) {
      wordLoss += lost.length;
      console.log(`\n  WORD LOSS in ${post.slug}: ${lost.slice(0, 12).join(", ")}`);
    }
  }
  console.log(`\n  words lost across all posts: ${wordLoss}`);

  if (SAMPLE) {
    const sample = converted.posts[0];
    console.log(`\n=== sample: ${sample.title} ===\n`);
    console.log(sample.html.slice(0, 1600));
  }

  if (APPLY) {
    console.log("\napplying…");
    for (const p of converted.posts) {
      await pool.query("update blog_blogpost set content_html = $1 where id = $2", [p.html, p.id]);
    }
    for (const p of converted.projects) {
      await pool.query("update projects_project set description_html = $1 where id = $2", [p.html, p.id]);
    }
    console.log(`wrote ${converted.posts.length} posts and ${converted.projects.length} projects.`);
  } else {
    console.log("\n(dry run -- nothing written. Pass --apply to write.)");
  }

  await pool.end();
}
