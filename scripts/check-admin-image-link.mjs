/**
 * An image field takes bytes from two places, and both end in the same bucket.
 *
 * A file the browser posts, or a link the server fetches on save. The link is a
 * *source* of bytes rather than a place the site points at: what comes back is
 * stored under a content-addressed key, so a linked image and an uploaded one
 * are indistinguishable by the time anything renders either. That is what keeps
 * `next/image`'s remote allow-list, the CSP `img-src` and reference-counted
 * cleanup untouched by the whole feature.
 *
 * What this covers, and a unit test cannot:
 *
 * - **A pasted link becomes an object.** End to end, through the real form and
 *   the real save action, against the real bucket.
 * - **The same link twice is one object and one asset row.** The key carries a
 *   digest of the content, so the second save finds the first row rather than
 *   making a second -- and a duplicate would split the reference count in two,
 *   which is exactly how `deleteUnreferenced` comes to delete a file another
 *   record still names.
 * - **A link the server must not follow is refused.** A private address is the
 *   one that matters: without the check, a link is a way to make this server
 *   fetch from its own network on somebody else's behalf.
 * - **A link that does not resolve to a file is refused rather than stored**,
 *   with a message naming the reason, at the field.
 * - **Both doors at once is refused.** Only reachable before the bundle
 *   arrives, because the hydrated control disables whichever input its switch
 *   is not showing -- so this is driven with the chunks blocked, which is also
 *   where "the form still works unhydrated" is proved for this control.
 *
 * What the *rules* are is settled offline: `lib/storage/link.test.ts` holds the
 * scheme, address and content-sniffing matrix, and
 * `lib/admin/image-source.test.ts` the precedence between the two doors. This
 * script exists for the parts that need a browser, a database and a bucket.
 *
 * Writes, and cleans up after itself: one `zz-` organisation per run, removed
 * in a `finally` that then proves the removal, along with any object the run
 * put in the bucket that nothing else came to name.
 *
 * Needs `--conditions=react-server` for the storage client, and `npm run dev`.
 *
 *   npx tsx --conditions=react-server scripts/check-admin-image-link.mjs [base]
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const { chromium } = await import("playwright");
const { staffAccountId } = await import("./fixture-ids.mjs");
const { encode } = await import("next-auth/jwt");
const { db, pool } = await import("../lib/db/client.ts");
const { ADMIN_ENTRIES_BY_KEY, adminPath } = await import("../lib/admin/registry.ts");
const { mediaAsset, organization } = await import("../lib/db/app-schema.ts");
const { objectExists } = await import("../lib/storage/objects.ts");
const { mediaUrl } = await import("../lib/storage/media.ts");
const { keyForMediaId } = await import("../lib/admin/media.ts");
const { deleteUnreferenced } = await import("../lib/storage/cleanup.ts");
const { eq } = await import("drizzle-orm");

const BASE = process.argv[2] ?? "http://localhost:3000";
const COOKIE = "authjs.session-token";

/**
 * Where the screen lives, asked of the registry rather than written down.
 * `organization` is a Settings tab, so its flat URL is refused outright and a
 * literal here would drive a not-found page tens of lines before it said so.
 */
const entry = ADMIN_ENTRIES_BY_KEY.get("organization");
if (!entry) throw new Error("organization is not a registered admin screen");
const ORGANIZATION = adminPath(entry);

/** Distinctive enough that a leftover row is obviously this script's. */
const MARK = `zz-image-link-check-${Date.now()}`;

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push({ name, pass });
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

/** A 1x1 PNG, for the one case that needs a file as well as a link. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

/**
 * The link this run pastes, taken from the database rather than written down.
 *
 * The public URL of an object already in this project's own bucket: a real
 * image over real HTTPS, on a host that is definitely up whenever the rest of
 * this script can run at all, and belonging to nobody else. Hard-coding a third
 * party would make a red result mean "somebody else's server is down" as often
 * as it meant a fault here.
 */
const [fixture] = await db
  .select({ storageKey: mediaAsset.storageKey })
  .from(mediaAsset)
  .where(eq(mediaAsset.source, "storage"))
  .limit(1);

if (!fixture) throw new Error("No stored media_asset to link to; nothing to fetch.");
if (!(await objectExists(fixture.storageKey))) {
  throw new Error(`The fixture object ${fixture.storageKey} is not in the bucket.`);
}

const LINK = mediaUrl(fixture.storageKey);
console.log(`\nlinking ${LINK}\n`);

const token = await encode({
  token: { sub: await staffAccountId() },
  secret: process.env.AUTH_SECRET,
  salt: COOKIE,
  maxAge: 60 * 15,
});

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await context.addCookies([{ name: COOKIE, value: token, domain: "localhost", path: "/" }]);
const page = await context.newPage();

/** Rows and objects this run made, cleared in the `finally` whatever happens. */
const createdOrgs = [];
const createdKeys = new Set();

const submit = async (target = page) => {
  await target
    .locator('form:has(button[type="submit"]:text-matches("Save|Create"))')
    .locator('button[type="submit"]')
    .click();
  await target.waitForTimeout(2500);
};

/** The storage key an image column points at; the bucket has never heard of ids. */
const keyOf = async (id) => (id ? await keyForMediaId(id) : "");

const orgNamed = async (name) => {
  const [row] = await db
    .select({ id: organization.id, logoId: organization.logoId })
    .from(organization)
    .where(eq(organization.name, name));
  return row ?? null;
};

/** Open the create form and put a name in it, so the row can be found again. */
const startOrg = async (name) => {
  await page.goto(`${BASE}${ORGANIZATION}/new`, { waitUntil: "load" });
  await page.waitForTimeout(700);
  await page.fill('[name="name"]', name);
};

/**
 * Put a link in the box, switching the control to it first where there is a
 * switch to use.
 *
 * Hydrated, the box is hidden **and disabled** until its side of the switch is
 * chosen -- hidden alone would still post, which is the whole reason the
 * control disables it too. Unhydrated there is no switch and both inputs are on
 * screen, so the click is skipped rather than waited for.
 */
const paste = async (value, target = page) => {
  const chooser = target.locator('[aria-label="How to supply logo"] button:has-text("Link")');
  if ((await chooser.count()) > 0) await chooser.first().click();
  await target.fill('[name="logo__link"]', value);
};

/**
 * Whatever the form said about a field, or `""`.
 *
 * `count()` first, deliberately: `textContent()` on a locator that matches
 * nothing waits the full timeout and then throws, which turns "there was no
 * message" into a crash thirty seconds later rather than a failed check.
 */
const fieldError = async (target = page) => {
  const problem = target.locator('[id$="-error"], [role="alert"]').first();
  if ((await problem.count()) === 0) return "";
  return (await problem.textContent())?.trim() ?? "";
};

let firstKey = "";

try {
  // --- a link becomes an object ---------------------------------------------
  console.log("\na pasted link is fetched and stored\n");

  await startOrg(`${MARK} Linked`);
  await paste(LINK);
  await submit();

  const linked = await orgNamed(`${MARK} Linked`);
  if (linked) createdOrgs.push(linked.id);
  firstKey = await keyOf(linked?.logoId);
  if (firstKey) createdKeys.add(firstKey);

  check("the record holds an asset", Boolean(linked?.logoId), firstKey || "no logo");
  check("the object it fetched is in the bucket", firstKey ? await objectExists(firstKey) : false);
  /*
   * The column names a `media_asset` row and that row names a bucket key, not
   * the link. Storing the URL is the design this deliberately did not take: it
   * would need `next/image` opened to arbitrary hosts and the CSP `img-src`
   * widened to all of https, and would leave the site depending on somebody
   * else's server.
   */
  check(
    "under a key of its own, not the link that supplied it",
    Boolean(firstKey) && !firstKey.includes("://"),
    firstKey,
  );
  check(
    "filed under the prefix the field declares",
    firstKey.startsWith("logo/"),
    firstKey,
  );

  // --- the same link twice ---------------------------------------------------
  console.log("\nthe same link twice is one object\n");

  await startOrg(`${MARK} Again`);
  await paste(LINK);
  await submit();

  const again = await orgNamed(`${MARK} Again`);
  if (again) createdOrgs.push(again.id);
  const againKey = await keyOf(again?.logoId);

  check("the second save lands on the same key", Boolean(againKey) && againKey === firstKey, againKey);
  /*
   * And on the same row. A second `media_asset` for one key would split the
   * reference count in two, so releasing one of the records would delete a file
   * the other still names -- which is the failure reference counting exists to
   * prevent and the one that is invisible until an image disappears.
   */
  check("and on the same asset row", Boolean(again?.logoId) && again.logoId === linked?.logoId);

  const rows = await db
    .select({ id: mediaAsset.id })
    .from(mediaAsset)
    .where(eq(mediaAsset.storageKey, firstKey));
  check("with exactly one media_asset naming it", rows.length === 1, `${rows.length} row(s)`);

  // --- links this must not follow -------------------------------------------
  console.log("\na link the server must not follow is refused\n");

  /*
   * The one that matters. Without the address check a link is a way to make
   * this server issue a request inside its own network on behalf of whoever
   * pasted it -- and the interesting targets there answer to a plain GET.
   */
  await page.goto(`${BASE}${ORGANIZATION}/${linked.id}`, { waitUntil: "load" });
  await page.waitForTimeout(700);
  await paste("http://127.0.0.1:3000/static/svg/icon/go.svg");
  await submit();

  const afterPrivate = await orgNamed(`${MARK} Linked`);
  check(
    "a link to a private address changes nothing",
    (await keyOf(afterPrivate?.logoId)) === firstKey,
  );
  check("and says so at the field", /not a host this can fetch/i.test(await fieldError()), await fieldError());

  await page.goto(`${BASE}${ORGANIZATION}/${linked.id}`, { waitUntil: "load" });
  await page.waitForTimeout(700);
  await paste(`${LINK}.does-not-exist`);
  await submit();

  const afterMissing = await orgNamed(`${MARK} Linked`);
  check(
    "a link to nothing changes nothing",
    (await keyOf(afterMissing?.logoId)) === firstKey,
  );
  check("and reports what the link answered", /answered \d{3}/i.test(await fieldError()), await fieldError());

  // --- both doors at once ----------------------------------------------------
  console.log("\nsupplying both a file and a link is refused\n");

  /*
   * Set by hand, because the interface will not produce this state: the
   * hydrated control disables whichever input its switch is not showing, since
   * a hidden form control still submits and only a disabled one does not.
   *
   * That is exactly why the server has to decide it anyway. The inputs are
   * uncontrolled, so a value written straight onto the element is what posts --
   * which is also what a request assembled outside the browser would carry.
   */
  await page.goto(`${BASE}${ORGANIZATION}/${linked.id}`, { waitUntil: "load" });
  await page.waitForTimeout(700);
  await page.setInputFiles('input[type="file"]', {
    name: "a-logo.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await page.evaluate(
    ([name, value]) => {
      const input = document.querySelector(`[name="${name}"]`);
      input.disabled = false;
      input.hidden = false;
      input.value = value;
    },
    ["logo__link", LINK],
  );
  await submit();

  const afterBoth = await orgNamed(`${MARK} Linked`);
  /*
   * Refused, not resolved. Picking a winner would be a save that silently threw
   * away one of two things somebody supplied, with no way to tell which.
   */
  check(
    "a post carrying both changes nothing",
    (await keyOf(afterBoth?.logoId)) === firstKey,
  );
  check(
    "and the message names the field",
    /both a file and a link/i.test(await fieldError()),
    await fieldError(),
  );

  // --- with nothing hydrated -------------------------------------------------
  /*
   * The contract every drawn control in this admin is held to: the real inputs
   * render on the server, and a form whose bundle never arrives is still a form
   * that saves. Both doors have to clear it, or the link is an enhancement that
   * quietly is not there.
   *
   * JavaScript stays ON and the chunks are blocked. With scripting off the
   * admin's forms are not merely unhydrated but invisible: React streams a
   * Suspense boundary into a `display: none` container and reveals it with a
   * small inline script.
   *
   * The *outcome* is read from the database rather than from the screen, and
   * that is not a shortcut. Without the bundle the page a server action
   * responds with never gets revealed either, so there is nothing on it to
   * assert -- which is why the message wording above is checked on a hydrated
   * page and the whole precedence matrix lives in `image-source.test.ts`.
   */
  console.log("\nunhydrated, both inputs are real and the link still saves\n");

  const bare = await browser.newContext();
  await bare.route("**/_next/static/chunks/**", (route) => route.abort());
  await bare.addCookies([{ name: COOKIE, value: token, domain: "localhost", path: "/" }]);
  const barePage = await bare.newPage();

  try {
    await barePage.goto(`${BASE}${ORGANIZATION}/new`, { waitUntil: "domcontentloaded" });
    await barePage.waitForTimeout(2500);

    const file = barePage.locator('input[type="file"]');
    const link = barePage.locator('[name="logo__link"]');

    check(
      "the file input is there and usable",
      (await file.count()) === 1 && (await file.isEnabled()),
    );
    check(
      "the link box is there and usable",
      (await link.count()) === 1 && (await link.isEnabled()) && (await link.isVisible()),
    );
    check(
      "and no switch is drawn over them yet",
      (await barePage.locator('[aria-label="How to supply logo"]').count()) === 0,
    );

    await barePage.fill('[name="name"]', `${MARK} Bare`);
    await paste(LINK, barePage);
    await submit(barePage);

    const bareOrg = await orgNamed(`${MARK} Bare`);
    if (bareOrg) createdOrgs.push(bareOrg.id);
    const bareKey = await keyOf(bareOrg?.logoId);
    if (bareKey) createdKeys.add(bareKey);

    check("and a link pasted into it still saves", Boolean(bareOrg?.logoId), bareKey || "no row");
    check("as the same object the hydrated form produced", bareKey === firstKey, bareKey);
  } finally {
    await bare.close();
  }
} finally {
  await browser.close();

  /*
   * Whatever failed above, nothing this run made is left behind -- and the
   * removal is proved rather than assumed, which is the same bargain every
   * writing harness here makes.
   */
  for (const id of createdOrgs) {
    await db.delete(organization).where(eq(organization.id, id));
  }
  // The objects, subject as always to nothing else having come to name them.
  const cleanup = await deleteUnreferenced([...createdKeys]);
  console.log(
    `\n  ..    cleaned up ${createdOrgs.length} organisation(s), ` +
      `${cleanup.deleted.length} object(s) deleted, ${cleanup.kept.length} still referenced`,
  );

  const remaining = [];
  for (const id of createdOrgs) {
    const [row] = await db.select({ id: organization.id }).from(organization).where(eq(organization.id, id));
    if (row) remaining.push(id);
  }
  check("every row this run created is gone", remaining.length === 0, remaining.join(", "));
  check("and no object it created failed to clean up", cleanup.failed.length === 0, cleanup.failed.join(", "));

  await pool.end();
}

const failed = checks.filter((entry) => !entry.pass).length;
console.log(
  failed === 0
    ? `\nAll ${checks.length} image-link checks passed.`
    : `\n${failed} of ${checks.length} image-link checks FAILED.`,
);
process.exit(failed === 0 ? 0 : 1);
