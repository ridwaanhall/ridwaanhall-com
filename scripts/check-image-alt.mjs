/**
 * An image can be described, and the description reaches the page.
 *
 *   npm run dev
 *   npx tsx --conditions=react-server scripts/check-image-alt.mjs
 *
 * `media_asset.alt` was in the schema from the beginning and was the only
 * column in it that nothing read and nothing wrote -- no form offered a field,
 * no query selected it. Alt text came from the *record* instead, so a post with
 * five screenshots described all five as that post's title, five times over.
 *
 * Two halves, and each fails differently, so both are asked:
 *
 * - The write goes through the whole form pipeline. The alt box is a sidecar
 *   input like the clear box and the link box, and it has to survive a save
 *   that touches **no bytes** -- which is the commonest save and the one an
 *   implementation naturally breaks, because `applyImageFields` returns early
 *   for an untouched image long before it would have read the description.
 * - The read has to reach the page. This is testable only because a save
 *   through the admin calls `updateTag`; the same assertion driven off a SQL
 *   write would sit behind a `cacheLife("days")` entry and pass whatever the
 *   page said.
 *
 * It edits a real asset's description and puts the old one back in a `finally`
 * that then proves the restore.
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const { chromium } = await import("playwright");
const { staffAccountId } = await import("./fixture-ids.mjs");
const { encode } = await import("next-auth/jwt");
const { pool } = await import("../lib/db/client.ts");

const BASE = process.argv[2] ?? "http://localhost:3000";
const COOKIE = "authjs.session-token";
const MARK = `zz alt check ${Date.now()}`;

let failures = 0;
const check = (ok, label, detail = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}${ok || !detail ? "" : `\n          ${detail}`}`);
};

console.log(`Image alt text, against ${BASE}\n`);

/*
 * A post that actually has a gallery, found rather than written down. A slug
 * literal here would keep driving a form after the post it names was renamed,
 * and the failure would be "no alt input" rather than "no such post".
 */
/** So a title carrying a bracket is matched rather than compiled. */
const escapeRegExp = (value) => value.replace(/[.*+?^\${}()|[\]\\]/g, "\\$&");

const { rows: targets } = await pool.query(`
  select p.id as post_id, p.slug, p.title, m.id as asset_id, m.alt
  from app.blog_post p
  join app.blog_image bi on bi.post_id = p.id
  join app.media_asset m on m.id = bi.media_id
  where p.is_published = true
  order by bi.position
  limit 1
`);
if (targets.length === 0) throw new Error("no published post has a gallery image to describe");
const target = targets[0];
const original = target.alt;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
try {
  const token = await encode({
    token: { sub: await staffAccountId() },
    secret: process.env.AUTH_SECRET,
    salt: COOKIE,
    maxAge: 60 * 15,
  });
  await context.addCookies([{ name: COOKIE, value: token, domain: "localhost", path: "/" }]);
  const page = await context.newPage();

  /*
   * Read before anything is written, because the fallback is what every
   * undescribed image gets and this is the one moment such an image is
   * guaranteed to be on the page. Asserted apart from the stored description:
   * "the stored one is preferred" and "the built one still appears where
   * nothing is stored" are different bugs, and an implementation that replaced
   * the fallback rather than preferring the stored value would satisfy every
   * other check here while describing most of the site's images as nothing.
   */
  const beforeSave = await (await fetch(`${BASE}/blog/${target.slug}`)).text();
  const fragment = escapeRegExp(target.title.slice(0, 24));
  check(
    new RegExp(`alt="[^"]*${fragment}`).test(beforeSave),
    "an image with no description falls back to one built from the record",
    `no alt attribute mentions ${JSON.stringify(target.title.slice(0, 24))}`,
  );

  await page.goto(`${BASE}/admin/blog-post/${target.post_id}`, { waitUntil: "load" });

  // The gallery's first row, not the post's own author photo -- an inline is
  // the half a record-level implementation silently leaves out.
  const box = page.locator('input[name^="images:"][name$="__alt"]').first();
  check((await box.count()) > 0, "an inline image row offers a description box");

  await box.fill(MARK);
  await page.getByRole("button", { name: /^Save$/ }).first().click();

  /*
   * Waited for by the notice, not by `networkidle`.
   *
   * The save is a server action, and the network settles while the write is
   * still in flight -- so a run that read the row straight after reported an
   * empty description and a working pipeline as broken. The notice is the
   * server saying it committed, which is the thing this needs to be true.
   */
  await page.getByText("Saved.", { exact: false }).first().waitFor({ timeout: 15000 });

  const { rows: after } = await pool.query("select alt from app.media_asset where id = $1", [
    target.asset_id,
  ]);
  check(
    after[0]?.alt === MARK,
    "saving without touching the image still writes the description",
    `media_asset.alt is ${JSON.stringify(after[0]?.alt)}`,
  );

  const article = await (await fetch(`${BASE}/blog/${target.slug}`)).text();
  check(
    article.includes(MARK),
    "and the page renders it",
    "the description is stored and the article does not use it",
  );

} finally {
  await context.close();
  await browser.close();

  await pool.query("update app.media_asset set alt = $1 where id = $2", [original, target.asset_id]);
  const { rows } = await pool.query("select alt from app.media_asset where id = $1", [
    target.asset_id,
  ]);
  check(
    rows[0]?.alt === original,
    "the description this run changed is back as it was",
    `expected ${JSON.stringify(original)}, found ${JSON.stringify(rows[0]?.alt)}`,
  );
  await pool.end();
}

console.log(failures ? `\n${failures} check(s) failed.` : "\nAn image says what it is.");
process.exitCode = failures ? 1 : 0;
