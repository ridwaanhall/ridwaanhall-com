/**
 * Publishing in the admin makes the public page appear, and unpublishing takes
 * it away, without a redeploy.
 *
 * A detail page whose slug was not in `generateStaticParams` at build time is
 * rendered on its first visit and kept in the ISR cache. Visited while its row
 * was still a draft, what got kept was the not-found render. Saving in the
 * admin expired the `project` tag and the lists moved on, but those entries did
 * not, so five new projects answered "not out yet" in production until the
 * site was redeployed.
 *
 * So this drives exactly that order, for a project and for a post: visit the
 * draft's URL until it is cached, publish it through the admin as a person
 * would, and require the page to answer with the row. Then unpublish it the
 * same way and require it to be gone again, since a page that outlives its
 * row is the same bug pointed at a draft.
 *
 * **It needs a production server.** `next dev` caches nothing at the route
 * level, so it passes there whatever the code does:
 *
 *   npx next build && npx next start -p 3002
 *   npx tsx --conditions=react-server scripts/check-publish-reaches-page.mjs http://localhost:3002
 *
 * The rows it creates carry a `zz-` slug and are deleted in the `finally`,
 * which then proves they are gone.
 */
import { config } from "dotenv";
import { baseUrl, cookieScope, mintSession, pgPool, reporter, sessionCookieName } from "./harness.mjs";

config({ path: ".env.local", quiet: true });

const { chromium } = await import("playwright");
const { staffAccountId } = await import("./fixture-ids.mjs");
const { ADMIN_ENTRIES_BY_KEY, adminPath } = await import("../lib/admin/registry.ts");

const BASE = baseUrl();
const pool = pgPool(2);
const { check, finish } = reporter({ detailOnFailure: true });

// `fill` is whatever else the admin form insists on before it will save.
const KINDS = [
  { key: "project", table: "project", path: "projects", title: "zz Publish probe project", fill: {} },
  { key: "blog-post", table: "blog_post", path: "blog", title: "zz Publish probe post", fill: { author_name: "zz Probe" } },
];

/** What the public page currently says about the row: shown, or not found. */
async function read(kind, slug) {
  const res = await fetch(`${BASE}/${kind.path}/${slug}`, { headers: { "cache-control": "no-cache" } });
  const html = await res.text();
  // The title appears nowhere else: the not-found page does not echo the slug.
  return { shown: html.includes(kind.title), cache: res.headers.get("x-nextjs-cache") ?? "-" };
}

/**
 * The page after a save, asked a few times.
 *
 * An ISR entry that has been invalidated may still be served once while it is
 * regenerated, so the second answer is the one a reader can rely on. Anything
 * past three is not "available when published".
 */
async function settle(kind, slug, want) {
  let last;
  for (let i = 1; i <= 3; i++) {
    last = await read(kind, slug);
    if (last.shown === want) return { ok: true, tries: i, cache: last.cache };
    await new Promise((r) => setTimeout(r, 1000));
  }
  return { ok: false, tries: 3, cache: last.cache };
}

async function setPublished(page, kind, id, on) {
  await page.goto(`${BASE}${adminPath(ADMIN_ENTRIES_BY_KEY.get(kind.key))}/${id}`, { waitUntil: "networkidle" });
  const box = page.locator("input[name=isPublished]");
  if ((await box.isChecked()) !== on) await box.click();
  await page.getByRole("button", { name: /^Save$/ }).first().click();
  const notice = page.getByText(/Saved\.|No changes to save\.|need attention/).first();
  try {
    await notice.waitFor({ timeout: 20000 });
  } catch {
    const alerts = await page.locator("[role=alert], [role=status], [aria-live]").allTextContents();
    throw new Error(`No save notice on ${kind.key}; the page said: ${alerts.join(" | ").trim() || "nothing"}`);
  }
  return (await notice.textContent())?.trim();
}

const created = [];
const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  const token = await mintSession(await staffAccountId(), BASE, 60 * 20);
  await context.addCookies([{ name: sessionCookieName(BASE), value: token, ...cookieScope(BASE) }]);
  const page = await context.newPage();

  for (const kind of KINDS) {
    const slug = `zz-publish-probe-${Date.now().toString(36)}`;
    const {
      rows: [row],
    } = await pool.query(
      `insert into app.${kind.table} (slug, title, is_published${Object.keys(kind.fill).map((c) => `, ${c}`).join("")})
       values ($1, $2, false${Object.keys(kind.fill).map((_, i) => `, $${i + 3}`).join("")}) returning id`,
      [slug, kind.title, ...Object.values(kind.fill)],
    );
    created.push({ kind, id: row.id });

    // Twice, so the not-found render is in the cache before anything changes.
    await read(kind, slug);
    const draft = await read(kind, slug);
    check(`${kind.key}: a draft's page is not found`, !draft.shown, `cache ${draft.cache}`);

    const saidOn = await setPublished(page, kind, row.id, true);
    const on = await settle(kind, slug, true);
    // Which cache kept the old answer: the listing reads the same tagged data,
    // so a listing that moved on and a page that did not is the route's cache.
    const listed = (await (await fetch(`${BASE}/${kind.path}`)).text()).includes(`/${kind.path}/${slug}`);
    check(
      `${kind.key}: publishing shows the page`,
      on.ok,
      `after "${saidOn}", still not found (cache ${on.cache}; the listing ${listed ? "has" : "lacks"} it)`,
    );

    const saidOff = await setPublished(page, kind, row.id, false);
    const off = await settle(kind, slug, false);
    check(`${kind.key}: unpublishing takes it away`, off.ok, `after "${saidOff}", still shown (cache ${off.cache})`);
  }
} finally {
  await browser.close();
  for (const { kind, id } of created) await pool.query(`delete from app.${kind.table} where id = $1`, [id]);
  const { rows } = await pool.query(
    `select (select count(*) from app.project where slug like 'zz-publish-probe-%') + (select count(*) from app.blog_post where slug like 'zz-publish-probe-%') as left`,
  );
  check("the probe rows are gone", Number(rows[0].left) === 0, `${rows[0].left} left`);
  await pool.end();
}

process.exitCode = finish((n) => `All ${n} checks passed: a published row reaches its page without a redeploy.`);
