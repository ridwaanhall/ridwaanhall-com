/**
 * Every page has a Markdown twin, and nothing unpublished does.
 *
 *   node scripts/check-markdown.mjs [http://localhost:3000]
 *
 * Walks the sitemap, so a page added later is covered the day it exists, and
 * asks for each twin both ways an agent would: the page's address plus `.md`,
 * and the page's own address with `Accept: text/markdown`. What it holds:
 *
 * - every sitemap page answers with `text/markdown`, front matter and a title;
 * - no tag is left in any of them, however the stored HTML was nested;
 * - both ways of asking return the same text;
 * - `noindex` and a canonical `Link` to the page are sent, and `Vary: Accept`;
 * - `/llms.txt` lists every one of them, and no more;
 * - a draft has no twin and is not listed.
 *
 * Drafts are read from the database (rows that already exist), not made for
 * the check: a row written with SQL issues none of the cache tags a save
 * through the admin would, so asserting an inserted row's absence through a
 * cached read proves nothing -- see `check-drafts.mjs`.
 */
import { config } from "dotenv";
import { baseUrl, pgPool, reporter } from "./harness.mjs";

config({ path: ".env.local", quiet: true });

const BASE = baseUrl();
const { check, finish } = reporter({ detailOnFailure: true });

console.log("Markdown twins\n");

const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => new URL(m[1]).pathname.replace(/\/$/, "") || "/")
  .filter((p) => !/^\/(sign-in|admin|api|cv)/.test(p));
const unique = [...new Set(paths)];
check("the sitemap lists the site's pages", unique.length > 20, `${unique.length} found`);

const twinOf = (p) => (p === "/" ? "/index.md" : `${p}.md`);
const index = await (await fetch(`${BASE}/llms.txt`)).text();
const listed = new Set([...index.matchAll(/\]\(https?:\/\/[^)/]+(\/[^)]*\.md)\)/g)].map((m) => m[1]));

let bad = { type: [], front: [], tags: [], accept: [], headers: [], unlisted: [] };
for (const path of unique) {
  const twin = twinOf(path);
  const res = await fetch(`${BASE}${twin}`);
  const text = await res.text();
  if (res.status !== 200 || !(res.headers.get("content-type") ?? "").startsWith("text/markdown")) bad.type.push(`${twin} ${res.status} ${res.headers.get("content-type")}`);
  if (!text.startsWith("---\ntitle:") || !/\n# .+\n/.test(text)) bad.front.push(twin);
  // A tag, or the markup of one: what is left after code fences are taken out.
  const prose = text.replace(/```[\s\S]*?```/g, "");
  if (/<\/?(p|div|span|ul|ol|li|h[1-6]|strong|em|a|img|br|pre|code)[\s>/]/i.test(prose)) bad.tags.push(twin);
  const asked = await fetch(`${BASE}${path}`, { headers: { accept: "text/markdown" } });
  if (!(asked.headers.get("content-type") ?? "").startsWith("text/markdown") || (await asked.text()) !== text) bad.accept.push(path);
  const h = res.headers;
  if (!/noindex/.test(h.get("x-robots-tag") ?? "") || !/rel="canonical"/.test(h.get("link") ?? "") || !/Accept/i.test(h.get("vary") ?? "")) bad.headers.push(twin);
  if (!listed.has(twin)) bad.unlisted.push(twin);
}
check("every twin answers 200 as text/markdown", !bad.type.length, bad.type.slice(0, 3).join("; "));
check("each has front matter and a title", !bad.front.length, bad.front.slice(0, 3).join("; "));
check("none has a tag left in it", !bad.tags.length, bad.tags.slice(0, 3).join("; "));
check("asking by Accept header returns the same text", !bad.accept.length, bad.accept.slice(0, 3).join("; "));
check("each is noindex, canonical to its page, and varies on Accept", !bad.headers.length, bad.headers.slice(0, 3).join("; "));
check("llms.txt lists every one of them", !bad.unlisted.length, bad.unlisted.slice(0, 3).join("; "));

// Pages the sitemap leaves out on purpose but that have a twin: two real pages, and the CV, whose page is the PDF.
const EXTRA = new Set(["/openhire.md", "/guestbook.md", "/cv.md"]);
const stray = [...listed].filter((twin) => !unique.some((p) => twinOf(p) === twin) && !EXTRA.has(twin));
check("and nothing the sitemap does not", !stray.length, stray.slice(0, 3).join("; "));

const full = await fetch(`${BASE}/llms-full.txt`);
check("llms-full.txt carries them all", full.status === 200 && (await full.text()).length > 20000);
const gone = await fetch(`${BASE}/zz-nowhere.md`);
check("an address with no page has no twin", gone.status === 404);

/* ------------------------------------------------------------------ drafts */
const pool = pgPool(2);
try {
  const { rows } = await pool.query(
    `select 'blog' as kind, slug from app.blog_post where is_published = false and slug !~ '^zz-'
     union all select 'projects', slug from app.project where is_published = false and slug !~ '^zz-'`,
  );
  console.log(`\n  ${rows.length} existing draft(s) to look for`);
  for (const { kind, slug } of rows) {
    const res = await fetch(`${BASE}/${kind}/${slug}.md`);
    check(`a draft has no twin and is not listed: ${kind}/${slug}`, res.status === 404 && !index.includes(`/${kind}/${slug}.md`));
  }
} finally {
  await pool.end();
}

process.exit(finish("Every page has a twin, and no draft does."));
