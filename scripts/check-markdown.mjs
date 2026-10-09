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
import pg from "pg";

config({ path: ".env.local", quiet: true });

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
let failures = 0;
const check = (ok, label, detail = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}${ok || !detail ? "" : `\n          ${detail}`}`);
};

console.log("Markdown twins\n");

const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => new URL(m[1]).pathname.replace(/\/$/, "") || "/")
  .filter((p) => !/^\/(sign-in|admin|api|cv)/.test(p));
const unique = [...new Set(paths)];
check(unique.length > 20, "the sitemap lists the site's pages", `${unique.length} found`);

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
check(!bad.type.length, "every twin answers 200 as text/markdown", bad.type.slice(0, 3).join("; "));
check(!bad.front.length, "each has front matter and a title", bad.front.slice(0, 3).join("; "));
check(!bad.tags.length, "none has a tag left in it", bad.tags.slice(0, 3).join("; "));
check(!bad.accept.length, "asking by Accept header returns the same text", bad.accept.slice(0, 3).join("; "));
check(!bad.headers.length, "each is noindex, canonical to its page, and varies on Accept", bad.headers.slice(0, 3).join("; "));
check(!bad.unlisted.length, "llms.txt lists every one of them", bad.unlisted.slice(0, 3).join("; "));

// Pages the sitemap leaves out on purpose but that have a twin: two real pages, and the CV, whose page is the PDF.
const EXTRA = new Set(["/openhire.md", "/guestbook.md", "/cv.md"]);
const stray = [...listed].filter((twin) => !unique.some((p) => twinOf(p) === twin) && !EXTRA.has(twin));
check(!stray.length, "and nothing the sitemap does not", stray.slice(0, 3).join("; "));

const full = await fetch(`${BASE}/llms-full.txt`);
check(full.status === 200 && (await full.text()).length > 20000, "llms-full.txt carries them all");
const gone = await fetch(`${BASE}/zz-nowhere.md`);
check(gone.status === 404, "an address with no page has no twin");

/* ------------------------------------------------------------------ drafts */
const url = new URL(process.env.STORAGE_POSTGRES_URL);
url.searchParams.delete("sslmode");
const pool = new pg.Pool({ connectionString: url.toString(), max: 2, ssl: { rejectUnauthorized: false } });
try {
  const { rows } = await pool.query(
    `select 'blog' as kind, slug from app.blog_post where is_published = false and slug !~ '^zz-'
     union all select 'projects', slug from app.project where is_published = false and slug !~ '^zz-'`,
  );
  console.log(`\n  ${rows.length} existing draft(s) to look for`);
  for (const { kind, slug } of rows) {
    const res = await fetch(`${BASE}/${kind}/${slug}.md`);
    check(res.status === 404 && !index.includes(`/${kind}/${slug}.md`), `a draft has no twin and is not listed: ${kind}/${slug}`);
  }
} finally {
  await pool.end();
}

console.log(failures ? `\n${failures} check(s) failed.` : "\nEvery page has a twin, and no draft does.");
process.exit(failures ? 1 : 0);
