/**
 * The rich-text editor, and the sanitiser behind it.
 *
 * What matters here is not that the editor works -- it is that what it produces
 * and what the page renders stay the same thing:
 *
 * - **Opening a post and saving it changes nothing.** The editor is loaded with
 *   the stored HTML and only reserialises once something is typed, so an
 *   untouched save must write the bytes back exactly.
 * - **An edit reserialises the whole document**, and ProseMirror's schema
 *   requires a block child in every table cell -- so `<td>x</td>` comes back as
 *   `<td><p>x</p></td>`. That is unavoidable, so `styles/prose.css` is what has
 *   to make the two render identically, and this measures that it does.
 * - **The sanitiser is the guard, not the editor.** The editor cannot produce a
 *   `<script>`; a crafted POST can, and is what this sends.
 *
 * The live post it opens is snapshotted and restored in the `finally`.
 *
 *   npx tsx --conditions=react-server scripts/check-admin-richtext.mjs [base]
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const { chromium } = await import("playwright");
const { encode } = await import("next-auth/jwt");
const { db, pool } = await import("../lib/db/client.ts");
const { blogBlogpost } = await import("../lib/db/schema.ts");
const { sanitizeRichText } = await import("../lib/utils/sanitize.ts");
const { eq } = await import("drizzle-orm");

const BASE = process.argv[2] ?? "http://localhost:3000";
const COOKIE = "authjs.session-token";
/** A post with a table, a code block and emoji -- the awkward shapes together. */
const POST_ID = 20;

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push({ name, pass });
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

const token = await encode({
  token: { sub: "1" },
  secret: process.env.AUTH_SECRET,
  salt: COOKIE,
  maxAge: 60 * 15,
});

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
await context.addCookies([{ name: COOKIE, value: token, domain: "localhost", path: "/" }]);
const page = await context.newPage();

const submit = async () => {
  await page
    .locator('form:has(button[type="submit"]:text-matches("Save|Create"))')
    .locator('button[type="submit"]')
    .click();
  await page.waitForTimeout(1600);
};

let snapshot = null;

try {
  // --- the sanitiser, on its own --------------------------------------------
  const hostile =
    '<p>ok</p><script>alert(1)</script><a href="javascript:alert(1)">x</a><h1>too big</h1><img src="x.png">';
  const cleaned = sanitizeRichText(hostile);
  check("a script tag is dropped", !cleaned.includes("<script"), cleaned.slice(0, 60));
  check("a javascript: href is dropped", !cleaned.includes("javascript:"));
  check("h1 is dropped, since the page owns it", !cleaned.includes("<h1"));
  check("what is allowed survives", cleaned.includes("<p>ok</p>"));

  // --- the editor loads what is stored --------------------------------------
  [snapshot] = await db.select().from(blogBlogpost).where(eq(blogBlogpost.id, POST_ID));
  const stored = snapshot.contentHtml;

  await page.goto(`${BASE}/admin/blog-post/${POST_ID}`, { waitUntil: "load" });
  await page.waitForTimeout(2400);

  const loaded = await page.evaluate(
    () => document.querySelector('input[name="contentHtml"]').value,
  );
  check("the editor is loaded with exactly the stored HTML", loaded === stored, `${stored.length} chars`);
  check("and it rendered as a document, not as markup", (await page.locator(".ProseMirror table").count()) === 1);

  // --- an untouched save -----------------------------------------------------
  await submit();
  const [untouched] = await db
    .select({ html: blogBlogpost.contentHtml })
    .from(blogBlogpost)
    .where(eq(blogBlogpost.id, POST_ID));
  check("opening and saving it changes nothing", untouched.html === stored);

  // --- an edit ---------------------------------------------------------------
  await page.goto(`${BASE}/admin/blog-post/${POST_ID}`, { waitUntil: "load" });
  await page.waitForTimeout(2400);
  await page.locator(".ProseMirror").click();
  await page.keyboard.press("Control+End");
  await page.keyboard.type("X");
  await page.keyboard.press("Backspace");
  await page.waitForTimeout(400);
  await submit();

  const [edited] = await db
    .select({ html: blogBlogpost.contentHtml })
    .from(blogBlogpost)
    .where(eq(blogBlogpost.id, POST_ID));
  /*
   * ProseMirror also writes `colspan="1" rowspan="1"` on every cell, which is
   * where most of the growth comes from. Both are on the sanitiser's allow-list
   * and neither changes the rendering, so they are left alone rather than
   * stripped -- the alternative is a transform that has to know which
   * attributes are redundant, for two posts with tables.
   */
  check(
    "an edit reserialises the document, wrapping table cells",
    edited.html !== stored && /<td[^>]*><p>/.test(edited.html),
    `${stored.length} -> ${edited.html.length} chars`,
  );
  check(
    "the text itself is untouched",
    stripTags(edited.html) === stripTags(stored),
    `${stripTags(stored).length} chars of text`,
  );

  // --- and the two forms render the same ------------------------------------
  const article = await context.newPage();
  await article.goto(`${BASE}/blog/${snapshot.slug}`, { waitUntil: "load" });
  await article.waitForTimeout(1400);
  const wrapped = await article.evaluate(() => {
    const cell = document.querySelector(".prose-content td");
    return cell ? Math.round(cell.getBoundingClientRect().height) : null;
  });
  const bare = await article.evaluate(() => {
    for (const cell of document.querySelectorAll(".prose-content td, .prose-content th")) {
      const only = cell.querySelector(":scope > p:only-child");
      if (only) cell.innerHTML = only.innerHTML;
    }
    const cell = document.querySelector(".prose-content td");
    return cell ? Math.round(cell.getBoundingClientRect().height) : null;
  });
  await article.close();
  check(
    "a wrapped cell is the same height as a bare one",
    wrapped !== null && wrapped === bare,
    `${wrapped}px vs ${bare}px`,
  );
} finally {
  if (snapshot) {
    await db.update(blogBlogpost).set(snapshot).where(eq(blogBlogpost.id, POST_ID));
    const [now] = await db.select().from(blogBlogpost).where(eq(blogBlogpost.id, POST_ID));
    check(
      "the post is back exactly as it was found",
      JSON.stringify(now) === JSON.stringify(snapshot),
      `${now.contentHtml.length} chars`,
    );
  }
  await browser.close();
  await pool.end();
}

/**
 * The visible words, with every tag treated as a separator.
 *
 * Replacing tags with a space rather than nothing is what makes the comparison
 * meaningful: the stored HTML has a newline between blocks and the reserialised
 * one does not, so removing tags outright would run "…to scan." into "We follow
 * …" on one side and not the other, and report a difference that is not there.
 */
function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const failed = checks.filter((entry) => !entry.pass);
console.log(
  failed.length === 0
    ? `\nAll ${checks.length} rich-text checks passed.`
    : `\n${failed.length} of ${checks.length} checks FAILED.`,
);
process.exit(failed.length === 0 ? 0 : 1);
