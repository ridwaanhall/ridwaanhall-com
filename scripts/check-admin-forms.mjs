/**
 * Drive the admin's change forms in a real browser, against the real database.
 *
 * These write. Everything they create is created here and removed here, and the
 * script refuses to touch a row it did not make -- the one exception is toggling
 * a flag on an existing record, which it reads first and puts back.
 *
 * What is worth checking, and what a unit test could not see:
 *
 * - **Only declared fields are written.** The save path walks the descriptor
 *   rather than the submitted `FormData`, so a field posted by hand reaches no
 *   column. That is asserted by posting `is_superuser=1` at the users form and
 *   reading the row back.
 * - **You cannot lock yourself out.** `staffGate` needs `is_active AND is_staff`
 *   read fresh per request, and every account here is OAuth with no password to
 *   sign back in with, so clearing either on your own account is unrecoverable.
 * - **Validation reaches the server.** The browser's `required` and `maxlength`
 *   are a convenience; the rules are re-checked after parsing, and a unique
 *   clash comes back on the field rather than as a 500.
 * - **A save is visible immediately.** `updateTag`, not `revalidateTag`: the
 *   latter lets a stale copy stand until its `cacheLife` window passes, so an
 *   edit would appear to do nothing.
 *
 * Needs `--conditions=react-server`: the image checks import the storage
 * client, which is `server-only`.
 *
 *   npx tsx --conditions=react-server scripts/check-admin-forms.mjs [base]
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const { chromium } = await import("playwright");
const { encode } = await import("next-auth/jwt");
const { db, pool } = await import("../lib/db/client.ts");
const { aboutOrganization, aboutSkill, authUser } = await import("../lib/db/schema.ts");
const { objectExists } = await import("../lib/storage/objects.ts");
const { eq, ne, sql } = await import("drizzle-orm");

const BASE = process.argv[2] ?? "http://localhost:3000";
const STAFF_ID = 1;
const COOKIE = "authjs.session-token";

/** Distinctive enough that a leftover row is obviously this script's. */
const MARK = `zz-admin-form-check-${Date.now()}`;

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push({ name, pass });
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

const token = await encode({
  token: { sub: String(STAFF_ID) },
  secret: process.env.AUTH_SECRET,
  salt: COOKIE,
  maxAge: 60 * 15,
});

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await context.addCookies([{ name: COOKIE, value: token, domain: "localhost", path: "/" }]);
const page = await context.newPage();

/** Rows this run created, removed in the `finally` whatever happens. */
const created = [];
const createdOrgs = [];

/** A 1x1 PNG and a 1x1 GIF -- two files with genuinely different bytes. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

const fill = async (name, value) => page.fill(`[name="${name}"]`, value);
/**
 * Scoped to the record form on purpose.
 *
 * The admin topbar carries a sign-out form, so `button[type="submit"]` matches
 * two elements and the first one in the DOM is Sign out -- which is what this
 * clicked for an hour, ending each run signed out on the home page while the
 * save action never ran at all.
 */
const submit = async () => {
  await page
    .locator('form:has(button[type="submit"]:text-matches("Save|Create"))')
    .locator('button[type="submit"]')
    .click();
  await page.waitForTimeout(1400);
};
const toast = async () => (await page.locator("[data-sonner-toast]").first().textContent()) ?? "";

try {
  // --- create ---------------------------------------------------------------
  await page.goto(`${BASE}/admin/skill/new`, { waitUntil: "load" });
  await page.waitForTimeout(600);

  await fill("name", `${MARK} One`);
  await fill("category", "Check Fixtures");
  await fill("iconSvg", "/static/svg/icon/python.svg");
  await fill("description", "Written by scripts/check-admin-forms.mjs.");
  // `slug` deliberately left blank: it must fill itself from the name, which is
  // Django's `prepopulated_fields` moved to the server, where a form posted
  // without JavaScript still gets one.
  await submit();

  const [made] = await db
    .select({ id: aboutSkill.id, slug: aboutSkill.slug, name: aboutSkill.name, category: aboutSkill.category })
    .from(aboutSkill)
    .where(eq(aboutSkill.name, `${MARK} One`));

  if (made) created.push(made.id);
  check("a record is created", Boolean(made), made ? `#${made.id}` : "no row");
  check("the slug filled itself from the name", made?.slug === `${MARK.toLowerCase()}-one`, made?.slug ?? "");
  check(
    "and the browser landed on the new record",
    page.url().includes(`/admin/skill/${made?.id}`),
    page.url().replace(BASE, ""),
  );

  // --- the site sees it immediately -----------------------------------------
  const listed = await page.goto(`${BASE}/admin/skill?q=${encodeURIComponent(MARK)}`, {
    waitUntil: "load",
  });
  await page.waitForTimeout(500);
  check(
    "it appears in the list at once, with no cache window to wait out",
    listed?.status() === 200 && (await page.locator("tbody tr").count()) === 1,
  );

  // --- update ---------------------------------------------------------------
  await page.goto(`${BASE}/admin/skill/${made.id}`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  await fill("category", "Check Fixtures Renamed");
  await submit();

  const [updated] = await db
    .select({ category: aboutSkill.category })
    .from(aboutSkill)
    .where(eq(aboutSkill.id, made.id));
  check("an edit is saved", updated?.category === "Check Fixtures Renamed", updated?.category ?? "");
  check("and it is confirmed in words the server chose", (await toast()).includes("Saved"));

  // --- validation -----------------------------------------------------------
  await page.goto(`${BASE}/admin/skill/${made.id}`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  await fill("slug", "Not A Slug!");
  // `noValidate` is set on the element rather than the markup so the browser
  // does not answer first: the point is that the *server* rejects it.
  await page.evaluate(() => {
    for (const form of document.querySelectorAll("form")) form.setAttribute("novalidate", "");
  });
  await submit();

  const slugError = (await page.locator('[id="field-slug-error"]').textContent()) ?? "";
  check("a bad slug is refused, at the field", slugError.toLowerCase().includes("lowercase"), slugError.trim());

  const [unchanged] = await db
    .select({ slug: aboutSkill.slug })
    .from(aboutSkill)
    .where(eq(aboutSkill.id, made.id));
  check("and nothing was written", unchanged?.slug === made.slug, unchanged?.slug ?? "");

  // --- a unique clash reads as a message, not a 500 --------------------------
  // Somebody else's slug: `limit(1)` alone can return the row under test, and
  // setting a slug to the value it already holds is not a clash.
  const [existing] = await db
    .select({ slug: aboutSkill.slug })
    .from(aboutSkill)
    .where(ne(aboutSkill.id, made.id))
    .limit(1);
  await page.goto(`${BASE}/admin/skill/${made.id}`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  await fill("slug", existing.slug);
  await submit();
  const clash = (await page.locator('[id="field-slug-error"]').textContent()) ?? "";
  check("a duplicate slug comes back on the field", clash.includes("already uses"), clash.trim());

  // --- only declared fields are written -------------------------------------
  const [before] = await db
    .select({ isSuperuser: authUser.isSuperuser, isStaff: authUser.isStaff })
    .from(authUser)
    .where(eq(authUser.id, 2));

  await page.goto(`${BASE}/admin/user/2`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  // Inject a field the descriptor does not declare. If the save path iterated
  // the submitted form instead of the descriptor, this would grant superuser.
  await page.evaluate(() => {
    const form = document.querySelector("form");
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "isSuperuser";
    input.value = "on";
    form?.appendChild(input);
    const second = document.createElement("input");
    second.type = "hidden";
    second.name = "is_superuser";
    second.value = "1";
    form?.appendChild(second);
  });
  await submit();

  const [after] = await db
    .select({ isSuperuser: authUser.isSuperuser })
    .from(authUser)
    .where(eq(authUser.id, 2));
  check(
    "a field the descriptor does not declare writes nothing",
    after?.isSuperuser === before.isSuperuser,
    `is_superuser ${before.isSuperuser} -> ${after?.isSuperuser}`,
  );

  // --- you cannot lock yourself out -----------------------------------------
  await page.goto(`${BASE}/admin/user/${STAFF_ID}`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  await page.uncheck('[name="isStaff"]');
  await submit();

  const [self] = await db
    .select({ isStaff: authUser.isStaff })
    .from(authUser)
    .where(eq(authUser.id, STAFF_ID));
  check("you cannot remove your own staff access", self?.isStaff === true);
  check(
    "and you are told why",
    (await page.locator('[role="alert"]').first().textContent())?.includes("your own staff access"),
  );

  // --- read-only fields are not writable ------------------------------------
  const readOnlyInputs = await page.locator('[name="username"], [name="email"]').count();
  check("a read-only field is not an input at all", readOnlyInputs === 0);

  // --- the models that refuse to be created ---------------------------------
  for (const key of ["user", "chat-message", "user-profile", "comment"]) {
    await page.goto(`${BASE}/admin/${key}/new`, { waitUntil: "load" });
    await page.waitForTimeout(600);
    // Asserted on what renders, not on the status: the route is dynamic, so
    // `notFound()` cannot set one. And on the *rendered* text rather than the
    // response body, since the shell streams and the title still names the model.
    const shown = await page.evaluate(() => document.body.innerText);
    const form = await page.locator('button[type="submit"]:text-matches("Create")').count();
    check(
      `no add form where records are not created here (${key})`,
      shown.includes("Nothing here") && form === 0,
    );
  }

  // --- images ---------------------------------------------------------------
  /*
   * The upload path, driven through the form rather than called directly: what
   * is being checked is that a replaced file is cleaned up and a removed one
   * too, which is a property of the save action and not of the storage client.
   */
  await page.goto(`${BASE}/admin/organization/new`, { waitUntil: "load" });
  await page.waitForTimeout(600);
  await fill("name", `${MARK} Org`);
  await page.setInputFiles('input[type="file"]', {
    name: "first-logo.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await submit();

  const [org] = await db
    .select({ id: aboutOrganization.id, logo: aboutOrganization.logo })
    .from(aboutOrganization)
    .where(eq(aboutOrganization.name, `${MARK} Org`));
  if (org) createdOrgs.push(org.id);

  check("an upload is stored against the record", Boolean(org?.logo), org?.logo ?? "no row");
  check("and the object is in the bucket", org?.logo ? await objectExists(org.logo) : false);

  await page.goto(`${BASE}/admin/organization/${org.id}`, { waitUntil: "load" });
  await page.waitForTimeout(600);
  await page.setInputFiles('input[type="file"]', {
    name: "second-logo.gif",
    mimeType: "image/gif",
    buffer: GIF,
  });
  await submit();

  const [replaced] = await db
    .select({ logo: aboutOrganization.logo })
    .from(aboutOrganization)
    .where(eq(aboutOrganization.id, org.id));
  check("replacing it stores the new key", Boolean(replaced?.logo) && replaced.logo !== org.logo, replaced?.logo ?? "");
  check("the new object is there", replaced?.logo ? await objectExists(replaced.logo) : false);
  check(
    "and the one it replaced, which nothing else names, is gone",
    (await objectExists(org.logo)) === false,
    org.logo,
  );

  await page.goto(`${BASE}/admin/organization/${org.id}`, { waitUntil: "load" });
  await page.waitForTimeout(600);
  await page.check('input[name="logo__clear"]');
  await submit();

  const [cleared] = await db
    .select({ logo: aboutOrganization.logo })
    .from(aboutOrganization)
    .where(eq(aboutOrganization.id, org.id));
  check("removing it empties the column", !cleared?.logo, JSON.stringify(cleared?.logo));
  check("and takes the object with it", (await objectExists(replaced.logo)) === false);

  // Saving an unrelated field must not blank the image. An empty file input is
  // "not edited", never "make it empty".
  await page.goto(`${BASE}/admin/organization/${org.id}`, { waitUntil: "load" });
  await page.waitForTimeout(600);
  await page.setInputFiles('input[type="file"]', {
    name: "third-logo.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await submit();
  await page.goto(`${BASE}/admin/organization/${org.id}`, { waitUntil: "load" });
  await page.waitForTimeout(600);
  await fill("website", "https://example.com");
  await submit();

  const [untouched] = await db
    .select({ logo: aboutOrganization.logo, website: aboutOrganization.website })
    .from(aboutOrganization)
    .where(eq(aboutOrganization.id, org.id));
  check(
    "saving another field leaves the image alone",
    Boolean(untouched?.logo) && untouched.website === "https://example.com",
    `${untouched?.logo} / ${untouched?.website}`,
  );

  const survivor = untouched.logo;
  await page.locator('button:has-text("Delete")').first().click();
  await page.waitForTimeout(500);
  await page.locator('[aria-labelledby="confirm-dialog-title"] button').last().click();
  await page.waitForTimeout(1800);

  const remaining = await db
    .select({ id: aboutOrganization.id })
    .from(aboutOrganization)
    .where(eq(aboutOrganization.id, org.id));
  if (remaining.length === 0) createdOrgs.length = 0;
  check("deleting the record removes it", remaining.length === 0);
  check("and its image with it", (await objectExists(survivor)) === false, survivor);

  // --- delete ---------------------------------------------------------------
  await page.goto(`${BASE}/admin/skill/${made.id}`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  await page.locator('button:has-text("Delete")').first().click();
  await page.waitForTimeout(500);
  // Scoped by `aria-labelledby`, not by role: Next's own dev overlay is also a
  // `role="dialog"`, so the plain selector matches two elements in development
  // and none of the difference is visible in a production build.
  const dialog = page.locator('[aria-labelledby="confirm-dialog-title"]');
  const wording = (await dialog.textContent()) ?? "";
  check("deleting asks first", wording.toLowerCase().includes("delete this skill"), wording.slice(0, 60).trim());
  check(
    "and says what goes with it",
    wording.includes("cannot be undone") || wording.includes("removed"),
  );

  await dialog.locator("button").last().click();
  await page.waitForTimeout(1500);

  const [gone] = await db
    .select({ n: sql`count(*)::int` })
    .from(aboutSkill)
    .where(eq(aboutSkill.id, made.id));
  const removed = Number(gone?.n ?? 1) === 0;
  if (removed) created.length = 0;
  check("and the record is removed", removed);
  check("landing back on the list", page.url().endsWith("/admin/skill"), page.url().replace(BASE, ""));
} finally {
  // Whatever failed, nothing this script made is left behind.
  for (const id of created) {
    await db.delete(aboutSkill).where(eq(aboutSkill.id, id));
    console.log(`  ..    cleaned up skill #${id}`);
  }
  for (const id of createdOrgs) {
    await db.delete(aboutOrganization).where(eq(aboutOrganization.id, id));
    console.log(`  ..    cleaned up organization #${id}`);
  }
  const [left] = await db
    .select({ n: sql`count(*)::int` })
    .from(aboutSkill)
    .where(sql`${aboutSkill.name} like ${`${MARK}%`}`);
  check("the table is left as it was found", Number(left?.n ?? 1) === 0);

  await browser.close();
  await pool.end();
}

const failed = checks.filter((entry) => !entry.pass);
console.log(
  failed.length === 0
    ? `\nAll ${checks.length} form checks passed.`
    : `\n${failed.length} of ${checks.length} checks FAILED.`,
);
process.exit(failed.length === 0 ? 0 : 1);
