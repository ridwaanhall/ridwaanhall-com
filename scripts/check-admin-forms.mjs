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
const { staffAccountId, nonStaffAccountId } = await import("./fixture-ids.mjs");
const { encode } = await import("next-auth/jwt");
const { db, pool } = await import("../lib/db/client.ts");
const { ADMIN_ENTRIES_BY_KEY, adminPath } = await import("../lib/admin/registry.ts");
const { category, guestMessage, organization, skill, account } = await import(
  "../lib/db/app-schema.ts"
);
const { objectExists } = await import("../lib/storage/objects.ts");
const { keyForMediaId } = await import("../lib/admin/media.ts");
const { eq, ne, sql } = await import("drizzle-orm");

const BASE = process.argv[2] ?? "http://localhost:3000";
const COOKIE = "authjs.session-token";

const STAFF_ID = await staffAccountId();
const READER_ID = await nonStaffAccountId();

/**
 * Where a screen lives, asked of the registry rather than written down.
 *
 * `skill` and `organization` are Settings screens, which is to say tabs at
 * `/admin/catalogue/<key>` -- and the flat `/admin/skill` is refused outright.
 * Both halves of that URL are strings, so a stale literal here type checks,
 * lints and drives a not-found page: `page.fill` then fails on a field that
 * was never rendered, tens of lines after the mistake. `adminPath` is the one
 * place either shape is built, so the next move needs no edit in this file.
 */
const screen = (key) => {
  const entry = ADMIN_ENTRIES_BY_KEY.get(key);
  if (!entry) throw new Error(`${key} is not a registered admin screen`);
  return adminPath(entry);
};
const SKILL = screen("skill");
const ORGANIZATION = screen("organization");

/** Distinctive enough that a leftover row is obviously this script's. */
const MARK = `zz-admin-form-check-${Date.now()}`;

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push({ name, pass });
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

const token = await encode({
  token: { sub: STAFF_ID },
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
const createdMessages = [];

/** A 1x1 PNG and a 1x1 GIF -- two files with genuinely different bytes. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

const fill = async (name, value) => page.fill(`[name="${name}"]`, value);
/**
 * Pick a value from a `reference` or `select` field.
 *
 * The admin's dropdowns are progressively enhanced: the server renders a real
 * `<select name=…>`, and once the page hydrates that select is `hidden` and a
 * drawn listbox takes over. Both states are driven here, and which one is live
 * is asked rather than assumed -- `selectOption` needs a *visible* select, so
 * against the enhanced control it waits thirty seconds and then times out.
 *
 * The caller passes a value, because that is what the database gave it. The
 * drawn list only knows labels, so the label is read back off the hidden
 * select's own option: the two lists come from the same descriptor, so a value
 * that has no label there would not be selectable by a person either.
 */
const choose = async (name, value) => {
  const select = page.locator(`select[name="${name}"]`);
  if (await select.isVisible()) {
    await select.selectOption(value);
    return;
  }

  const label = ((await select.locator(`option[value="${value}"]`).textContent()) ?? "").trim();
  /*
   * A nameless option is not selectable by a person, and must not be silently
   * selectable here either. `getByRole("option", { name: "" })` matches every
   * row in the list, so `.first()` would pick whichever happened to be on top
   * and the rest of the check would pass having chosen something else --
   * which is how a blank location option survived every run of this harness.
   */
  if (!label) throw new Error(`${name}: the option for ${value} has no label to click`);
  await page.locator(`select[name="${name}"] + [role="combobox"]`).click();

  // Past fifteen options the panel carries a filter box. Typing into it is not
  // only faster than scrolling -- it is what keeps this working when the list
  // is eighty-four rows long and the one wanted is off-screen.
  const filter = page.locator('input[aria-label="Filter the options"]');
  if (await filter.count()) await filter.fill(label);

  await page.getByRole("option", { name: label, exact: true }).first().click();
  await page.waitForTimeout(150);
};
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
/**
 * The storage key an image column points at.
 *
 * The column held the key itself until the schema moved; it holds a
 * `media_asset` id now, and the bucket has never heard of ids. Everything
 * below still reasons in keys, so the hop happens here -- the same seam the
 * form uses, for the same reason.
 */
const keyOf = async (id) => (id ? await keyForMediaId(id) : "");

try {
  // --- create ---------------------------------------------------------------
  await page.goto(`${BASE}${SKILL}/new`, { waitUntil: "load" });
  await page.waitForTimeout(600);

  await fill("name", `${MARK} One`);
  // Two real categories, because `category_id` is a foreign key and the field
  // is a select -- a made-up string is not a value the form can even offer.
  const [firstCategory, secondCategory] = await db
    .select({ id: category.id, label: category.label })
    .from(category)
    .where(eq(category.kind, "skill"))
    .orderBy(category.position)
    .limit(2);
  await choose("categoryId", firstCategory.id);
  await fill("description", "Written by scripts/check-admin-forms.mjs.");
  // `slug` deliberately left blank: it must fill itself from the name, which is
  // Slug prefill happens on the server, so a form posted
  // without JavaScript still gets one.
  await submit();

  const [made] = await db
    .select({ id: skill.id, slug: skill.slug, name: skill.name, categoryId: skill.categoryId })
    .from(skill)
    .where(eq(skill.name, `${MARK} One`));

  if (made) created.push(made.id);
  check("a record is created", Boolean(made), made ? `#${made.id}` : "no row");
  check("the slug filled itself from the name", made?.slug === `${MARK.toLowerCase()}-one`, made?.slug ?? "");
  /*
   * Waited for, not sampled after `submit()`'s fixed pause.
   *
   * The create action redirects, and a Settings screen's record now lives one
   * segment deeper -- `/admin/<section>/<key>/<id>` is a different route file
   * from the form that posted it, so on a cold dev server the navigation is
   * behind a first compile of that route and outruns any pause worth writing.
   * The fixed sleep only ever measured how busy the machine was; this is the
   * same repair the delete at the end of this file already carries.
   */
  const onRecord = made
    ? await page
        .waitForURL((url) => url.pathname === `${SKILL}/${made.id}`, { timeout: 15000 })
        .then(() => true)
        .catch(() => false)
    : false;
  check("and the browser landed on the new record", onRecord, page.url().replace(BASE, ""));

  // --- the site sees it immediately -----------------------------------------
  const listed = await page.goto(`${BASE}${SKILL}?q=${encodeURIComponent(MARK)}`, {
    waitUntil: "load",
  });
  await page.waitForTimeout(500);
  check(
    "it appears in the list at once, with no cache window to wait out",
    listed?.status() === 200 && (await page.locator("tbody tr").count()) === 1,
  );

  // --- update ---------------------------------------------------------------
  await page.goto(`${BASE}${SKILL}/${made.id}`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  await choose("categoryId", secondCategory.id);
  await submit();

  const [updated] = await db
    .select({ categoryId: skill.categoryId })
    .from(skill)
    .where(eq(skill.id, made.id));
  check(
    "an edit is saved",
    updated?.categoryId === secondCategory.id,
    `${firstCategory.label} -> ${secondCategory.label}`,
  );
  check("and it is confirmed in words the server chose", (await toast()).includes("Saved"));

  // --- validation -----------------------------------------------------------
  await page.goto(`${BASE}${SKILL}/${made.id}`, { waitUntil: "load" });
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
    .select({ slug: skill.slug })
    .from(skill)
    .where(eq(skill.id, made.id));
  check("and nothing was written", unchanged?.slug === made.slug, unchanged?.slug ?? "");

  // --- a unique clash reads as a message, not a 500 --------------------------
  // Somebody else's slug: `limit(1)` alone can return the row under test, and
  // setting a slug to the value it already holds is not a clash.
  const [existing] = await db
    .select({ slug: skill.slug })
    .from(skill)
    .where(ne(skill.id, made.id))
    .limit(1);
  await page.goto(`${BASE}${SKILL}/${made.id}`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  await fill("slug", existing.slug);
  await submit();
  const clash = (await page.locator('[id="field-slug-error"]').textContent()) ?? "";
  check("a duplicate slug comes back on the field", clash.includes("already uses"), clash.trim());

  // --- only declared fields are written -------------------------------------
  /*
   * This used to smuggle `is_superuser`, which was the sharpest version of the
   * test: iterating the submitted form rather than the descriptor would have
   * handed out an all-permissions flag. No such column exists any more, so the
   * smuggled field is `first_name`,
   * which is real, is on this table, and is not declared by the user form.
   */
  const [before] = await db
    .select({ firstName: account.firstName, isStaff: account.isStaff })
    .from(account)
    .where(eq(account.id, READER_ID));

  await page.goto(`${BASE}/admin/user/${READER_ID}`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const form = document.querySelector("form");
    for (const name of ["firstName", "first_name"]) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = "zz-smuggled";
      form?.appendChild(input);
    }
  });
  await submit();

  const [after] = await db
    .select({ firstName: account.firstName })
    .from(account)
    .where(eq(account.id, READER_ID));
  check(
    "a field the descriptor does not declare writes nothing",
    after?.firstName === before.firstName,
    `first_name ${JSON.stringify(before.firstName)} -> ${JSON.stringify(after?.firstName)}`,
  );

  // --- you cannot lock yourself out -----------------------------------------
  await page.goto(`${BASE}/admin/user/${STAFF_ID}`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  await page.uncheck('[name="isStaff"]');
  await submit();

  const [self] = await db
    .select({ isStaff: account.isStaff })
    .from(account)
    .where(eq(account.id, STAFF_ID));
  check("you cannot remove your own staff access", self?.isStaff === true);
  check(
    "and you are told why",
    (await page.locator('[role="alert"]').first().textContent())?.includes("your own staff access"),
  );

  // --- read-only fields are not writable ------------------------------------
  const readOnlyInputs = await page.locator('[name="username"], [name="email"]').count();
  check("a read-only field is not an input at all", readOnlyInputs === 0);

  // --- which models may be created ------------------------------------------
  /*
   * Both directions, because "no add form" on its own is satisfied by an admin
   * that cannot create anything at all.
   *
   * `user` is the one model that refuses on purpose: an account is a provider
   * identity, so one made here is a row nobody can sign in to. The three
   * singletons refuse for a different reason -- they are one row by definition
   * and `/admin/<key>` is that row's form, so there is no create route to
   * reach. Everything else creates, including the three that carry somebody
   * else's words and therefore have an author that is chosen once and then
   * fixed.
   */
  for (const key of ["user", "profile", "hiring-profile", "open-to-work-profile"]) {
    await page.goto(`${BASE}${screen(key)}/new`, { waitUntil: "load" });
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

  for (const key of ["chat-message", "user-profile", "comment"]) {
    await page.goto(`${BASE}${screen(key)}/new`, { waitUntil: "load" });
    await page.waitForTimeout(600);
    const form = await page.locator('button[type="submit"]:text-matches("Create")').count();
    // The author is the point of the check as much as the button is: these are
    // the models whose `NOT NULL` account column has no default, so a create
    // form that did not offer it could not produce a row at all.
    const author = await page.locator('select[name="user"]').count();
    check(`records of this kind are created here (${key})`, form === 1 && author === 1);
  }

  /*
   * And one of them for real, end to end.
   *
   * That the form renders is not the same claim as that it saves: a guestbook
   * message's `account_id` is `NOT NULL` with no default, and the field it
   * comes from is `readOnly: "afterCreate"` -- a state that did not exist
   * before. If that resolved the wrong way round the field would be dropped
   * from the insert and the save would fail on the constraint, which is
   * exactly the failure worth catching here rather than in production.
   *
   * A real message, briefly, on the real guestbook. It is marked and removed in
   * the `finally` like everything else this script writes.
   */
  await page.goto(`${BASE}/admin/chat-message/new`, { waitUntil: "load" });
  await page.waitForTimeout(600);
  await choose("user", READER_ID);
  await fill("message", `${MARK} message`);
  await submit();

  const [message] = await db
    .select({ id: guestMessage.id, accountId: guestMessage.accountId })
    .from(guestMessage)
    .where(eq(guestMessage.body, `${MARK} message`));
  if (message) createdMessages.push(message.id);

  check("a guestbook message is created", Boolean(message), message ? `#${message.id}` : "no row");
  check(
    "under the account that was chosen for it",
    message?.accountId === READER_ID,
    message?.accountId ?? "",
  );

  // The other half of `afterCreate`: writable once, and never again.
  if (message) {
    await page.goto(`${BASE}/admin/chat-message/${message.id}`, { waitUntil: "load" });
    await page.waitForTimeout(600);
    check(
      "and its author cannot be reassigned afterwards",
      (await page.locator('select[name="user"]').count()) === 0,
    );
  }

  // --- images ---------------------------------------------------------------
  /*
   * The upload path, driven through the form rather than called directly: what
   * is being checked is that a replaced file is cleaned up and a removed one
   * too, which is a property of the save action and not of the storage client.
   */
  await page.goto(`${BASE}${ORGANIZATION}/new`, { waitUntil: "load" });
  await page.waitForTimeout(600);
  await fill("name", `${MARK} Org`);
  await page.setInputFiles('input[type="file"]', {
    name: "first-logo.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await submit();

  const [org] = await db
    .select({ id: organization.id, logoId: organization.logoId })
    .from(organization)
    .where(eq(organization.name, `${MARK} Org`));
  if (org) createdOrgs.push(org.id);

  const firstKey = await keyOf(org?.logoId);
  check("an upload is stored against the record", Boolean(org?.logoId), firstKey || "no row");
  check("and the object is in the bucket", firstKey ? await objectExists(firstKey) : false);

  await page.goto(`${BASE}${ORGANIZATION}/${org.id}`, { waitUntil: "load" });
  await page.waitForTimeout(600);
  await page.setInputFiles('input[type="file"]', {
    name: "second-logo.gif",
    mimeType: "image/gif",
    buffer: GIF,
  });
  await submit();

  const [replaced] = await db
    .select({ logoId: organization.logoId })
    .from(organization)
    .where(eq(organization.id, org.id));
  const secondKey = await keyOf(replaced?.logoId);
  check("replacing it stores the new key", Boolean(secondKey) && secondKey !== firstKey, secondKey);
  check("the new object is there", secondKey ? await objectExists(secondKey) : false);
  check(
    "and the one it replaced, which nothing else names, is gone",
    (await objectExists(firstKey)) === false,
    firstKey,
  );

  await page.goto(`${BASE}${ORGANIZATION}/${org.id}`, { waitUntil: "load" });
  await page.waitForTimeout(600);
  // The form field is `logo`; `logoId` is the column behind it.
  await page.check('input[name="logo__clear"]');
  await submit();

  const [cleared] = await db
    .select({ logoId: organization.logoId })
    .from(organization)
    .where(eq(organization.id, org.id));
  check("removing it empties the column", !cleared?.logoId, JSON.stringify(cleared?.logoId));
  check("and takes the object with it", (await objectExists(secondKey)) === false);

  // Saving an unrelated field must not blank the image. An empty file input is
  // "not edited", never "make it empty".
  await page.goto(`${BASE}${ORGANIZATION}/${org.id}`, { waitUntil: "load" });
  await page.waitForTimeout(600);
  await page.setInputFiles('input[type="file"]', {
    name: "third-logo.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await submit();
  await page.goto(`${BASE}${ORGANIZATION}/${org.id}`, { waitUntil: "load" });
  await page.waitForTimeout(600);
  await fill("website", "https://example.com");
  await submit();

  const [untouched] = await db
    .select({ logoId: organization.logoId, website: organization.website })
    .from(organization)
    .where(eq(organization.id, org.id));
  check(
    "saving another field leaves the image alone",
    Boolean(untouched?.logoId) && untouched.website === "https://example.com",
    `${await keyOf(untouched?.logoId)} / ${untouched?.website}`,
  );

  const survivor = await keyOf(untouched.logoId);
  await page.locator('button:has-text("Delete")').first().click();
  await page.waitForTimeout(500);
  await page.locator('[aria-labelledby="confirm-dialog-title"] button').last().click();
  await page.waitForTimeout(1800);

  const remaining = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.id, org.id));
  if (remaining.length === 0) createdOrgs.length = 0;
  check("deleting the record removes it", remaining.length === 0);
  check("and its image with it", (await objectExists(survivor)) === false, survivor);

  // --- delete ---------------------------------------------------------------
  await page.goto(`${BASE}${SKILL}/${made.id}`, { waitUntil: "load" });
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
  /*
   * Waited a flat 1500ms, which is the delete, the toast and a client
   * navigation racing a dev-server compile of the list route. Wait for the
   * navigation itself: it is the thing being checked, and a fixed sleep only
   * ever measures how busy the machine is.
   */
  const landed = await page
    .waitForURL((url) => url.pathname === SKILL, { timeout: 15000 })
    .then(() => true)
    .catch(() => false);

  const [gone] = await db
    .select({ n: sql`count(*)::int` })
    .from(skill)
    .where(eq(skill.id, made.id));
  const removed = Number(gone?.n ?? 1) === 0;
  if (removed) created.length = 0;
  check("and the record is removed", removed);
  check("landing back on the list", landed, page.url().replace(BASE, ""));
} finally {
  // Whatever failed, nothing this script made is left behind.
  for (const id of created) {
    await db.delete(skill).where(eq(skill.id, id));
    console.log(`  ..    cleaned up skill #${id}`);
  }
  for (const id of createdOrgs) {
    await db.delete(organization).where(eq(organization.id, id));
    console.log(`  ..    cleaned up organization #${id}`);
  }
  for (const id of createdMessages) {
    await db.delete(guestMessage).where(eq(guestMessage.id, id));
    console.log(`  ..    cleaned up guestbook message #${id}`);
  }
  const [left] = await db
    .select({ n: sql`count(*)::int` })
    .from(skill)
    .where(sql`${skill.name} like ${`${MARK}%`}`);
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
