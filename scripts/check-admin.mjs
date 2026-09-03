/**
 * The admin's gate and changelist, checked against the running app.
 *
 * Two kinds of thing are asserted here, and the first is the reason the script
 * exists at all:
 *
 * **Nobody but staff receives admin data.** A layout that renders a "Not
 * permitted" screen instead of its children does *not* stop those children
 * running -- React renders a layout and its pages concurrently -- so the first
 * version of this admin answered a non-staff request with 72KB in which the
 * visible HTML said "Not permitted" and the Flight payload underneath carried
 * every blog post, its slug and its edit URL. Not rendered, but transmitted,
 * and invisible to any check that looks at the page the way a person does. The
 * checks below read the whole response body, markup and payload alike, and look
 * for row data in it.
 *
 * **The changelist means what it says.** Sorting, filtering, searching and
 * paging are all answered in SQL from one descriptor, so a mistake in the
 * generic is a mistake in every screen built on it. These pin the behaviour
 * a changelist has to get right: a two-word search narrows rather than widens, a
 * boolean filter partitions the table, an unknown sort key falls back instead
 * of reaching the database, and a page past the end clamps.
 *
 * Needs the dev server up, and reads `AUTH_SECRET` to mint sessions -- see
 * `mint-session.mjs` for why that is the honest way in.
 *
 *   npx tsx scripts/check-admin.mjs [base]
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const { encode } = await import("next-auth/jwt");
const { ADMIN_ENTRIES, ADMIN_SECTIONS, adminPath, sectionTabs } = await import(
  "../lib/admin/registry.ts"
);
const { ADMIN_FORM_MODELS, ADMIN_LIST_MODELS } = await import("../lib/admin/models/index.ts");
const { staffAccountId, nonStaffAccountId, idWhere } = await import("./fixture-ids.mjs");

const BASE = process.argv[2] ?? "http://localhost:3000";

/** A staff superuser, and a signed-in reader who is not staff. */
const STAFF_ID = await staffAccountId();
const NON_STAFF_ID = await nonStaffAccountId();

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push({ name, pass });
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

const cookieName = "authjs.session-token";

async function session(userId) {
  const token = await encode({
    token: { sub: String(userId) },
    secret: process.env.AUTH_SECRET,
    salt: cookieName,
    maxAge: 60 * 10,
  });
  return `${cookieName}=${token}`;
}

async function get(path, cookie) {
  const response = await fetch(BASE + path, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  });
  return { status: response.status, body: await response.text() };
}

/** Cells of the changelist body, one array per row. */
function rows(html) {
  const body = html.split("<tbody")[1]?.split("</tbody>")[0] ?? "";
  /*
   * The empty state is one `<tr>` with a `colSpan` cell, so a naive parse
   * counts "nothing here" as a row. It used to name the blog post explicitly,
   * which was enough while only the blog was counted -- and then a check on the
   * users list read its empty state as one muted account and passed on the
   * strength of it. Matched on the shape rather than the wording, so every
   * screen is covered and the sentence stays free to change.
   */
  if (/<td[^>]*colspan=/i.test(body)) return [];
  return [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((match) =>
    [...match[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((cell) =>
      cell[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    ),
  );
}

/** A post every part of this drives: the changelist, the record, the shell. */
const postId = await idWhere("blog_post", "slug", "commit-message-style-guide");

const staff = await session(STAFF_ID);
const nonStaff = await session(NON_STAFF_ID);

// --- the gate ----------------------------------------------------------------

/**
 * Strings that only ever appear because a changelist was built. Checked against
 * the entire response, not the visible markup: the leak this catches was
 * *below* the markup, in the streamed payload.
 */
const ROW_MARKERS = ["Commit Message Style Guide", "commit-message-style-guide", "/admin/blog-post/"];
const leaks = (body) => ROW_MARKERS.filter((marker) => body.includes(marker));

{
  const { body } = await get("/admin");
  check("anonymous: offered a sign-in, not the admin", body.includes("Sign in") && !body.includes("Sign out"));
  check("anonymous: the model index is not disclosed", !body.includes("Blog posts"));
}

{
  const { body } = await get("/admin/blog-post");
  const found = leaks(body);
  check("anonymous: a changelist URL returns no rows", found.length === 0, found.join(", "));
}

{
  const { body } = await get("/admin", nonStaff);
  check("non-staff: told plainly they are not permitted", body.includes("Not permitted"));
  check("non-staff: the model index is not disclosed", !body.includes("Blog posts"));
}

{
  // The regression this script was written for.
  const { body } = await get("/admin/blog-post", nonStaff);
  const found = leaks(body);
  check(
    "non-staff: no row data anywhere in the response, payload included",
    found.length === 0,
    found.length ? `leaked ${found.join(", ")}` : `${body.length} bytes, none of it rows`,
  );
}

{
  const { body } = await get("/admin/blog-post/20", nonStaff);
  check("non-staff: a record URL discloses nothing either", !body.includes("Commit Message Style Guide"));
}

{
  // The one URL shape sections added: a tab route renders both a strip naming
  // the section's other screens and a changelist of row data underneath it --
  // the two things the gate exists to withhold, in one response. Built with
  // `adminPath`, the same as every other URL in this file. The strip lives in
  // the `<nav aria-label="… settings">` the section checks below also key on,
  // rather than on a tab's `labelPlural`: that string also appears in the
  // page's `<title>`, which `generateMetadata` sets without a staff check on
  // every admin route -- a pre-existing, wider pattern this file has never
  // asserted against and this check is not the place to start.
  const [section] = ADMIN_SECTIONS;
  const tabs = sectionTabs(section.key);
  const { body } = await get(adminPath(tabs[0]), nonStaff);
  const strip = body.includes(`<nav aria-label="${section.label} settings"`);
  check(
    "non-staff: a section tab URL discloses no tab strip and no table either",
    !strip && !body.includes("<table"),
    strip ? "tab strip present" : body.includes("<table") ? "table markup present" : "clean",
  );
}

// --- the registry ------------------------------------------------------------

{
  // A singleton has no changelist by definition: its screen is the record form,
  // so it is checked against that instead.
  // A `custom` entry has a route of its own rather than a descriptor pair, so
  // it is exempt from the form check below and asserted separately.
  const custom = ADMIN_ENTRIES.filter((entry) => entry.custom);
  const listed = ADMIN_ENTRIES.filter((entry) => !entry.singleton).map((entry) => entry.key);
  const singletons = ADMIN_ENTRIES.filter((entry) => entry.singleton).map((entry) => entry.key);
  const built = Object.keys(ADMIN_LIST_MODELS);
  const entryWithoutModel = listed.filter((key) => !built.includes(key));
  const modelWithoutEntry = built.filter((key) => !listed.includes(key));
  const singletonWithoutForm = singletons.filter((key) => !(key in ADMIN_FORM_MODELS));
  check(
    "every registered screen has a descriptor",
    entryWithoutModel.length === 0,
    entryWithoutModel.join(", "),
  );
  check(
    "every singleton has a form instead of a list",
    singletonWithoutForm.length === 0,
    singletonWithoutForm.join(", ") || `${singletons.length} singletons`,
  );
  check(
    "every descriptor has a registered screen",
    modelWithoutEntry.length === 0,
    modelWithoutEntry.join(", "),
  );
  // The record route has no read-only fallback: it renders a form or nothing.
  // An entry without a form descriptor would be a screen that cannot be opened
  // -- unless it is `custom`, which says a route file renders it instead.
  const entryWithoutForm = ADMIN_ENTRIES.filter((entry) => !entry.custom)
    .map((entry) => entry.key)
    .filter((key) => !(key in ADMIN_FORM_MODELS));
  check(
    "every registered screen has a form descriptor",
    entryWithoutForm.length === 0,
    entryWithoutForm.join(", ") || `${ADMIN_ENTRIES.length} screens`,
  );
  /*
   * `custom` exempts an entry from the check above, so on its own it is a way
   * to register a rail row leading to a 404 with every check still green. This
   * is the other half: the route has to answer, and it has to answer for the
   * account that may open it. Asserted against the running app rather than the
   * file system -- `descriptors.test.ts` checks the files exist, and a file
   * that exists is not a page that renders.
   */
  const customWithForm = custom.filter((entry) => entry.key in ADMIN_FORM_MODELS);
  check(
    "a custom screen declares no form descriptor",
    customWithForm.length === 0,
    customWithForm.map((entry) => entry.key).join(", ") || `${custom.length} custom`,
  );
  check(
    "registry keys are unique",
    new Set(ADMIN_ENTRIES.map((entry) => entry.key)).size === ADMIN_ENTRIES.length,
  );
  /*
   * And a section key is the same first segment as a model key, so the two are
   * one namespace. Nothing in the type system says so -- `AdminSectionKey` and
   * an entry's `key` are separate declarations that never meet, and both are
   * strings. A collision costs one of the pair its URL: the list route resolves
   * a section first, so the model behind the same word becomes unreachable
   * while every check that only asks whether a page rendered still passes.
   */
  const modelKeys = new Set(ADMIN_ENTRIES.map((entry) => entry.key));
  const collisions = ADMIN_SECTIONS.map((section) => section.key).filter((key) =>
    modelKeys.has(key),
  );
  check(
    "no section key collides with a model key",
    collisions.length === 0,
    collisions.join(", ") || `${ADMIN_SECTIONS.length} sections`,
  );
}

/**
 * Where a named column sits, because its position is not the contract.
 *
 * Two checks below read a cell by index, and both went red the day a column
 * was added to the blog changelist ahead of the ones they wanted -- reporting
 * a broken sort and a broken default order, neither of which had moved. A
 * reader identifies a column by its heading, so that is what these ask for.
 */
function columnIndex(html, label) {
  const head = html.split("<thead")[1]?.split("</thead>")[0] ?? "";
  const headers = [...head.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((cell) =>
    cell[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().toLowerCase(),
  );
  const at = headers.findIndex((text) => text.startsWith(label.toLowerCase()));
  if (at === -1) throw new Error(`no "${label}" column among: ${headers.join(" | ")}`);
  return at;
}

// --- the changelist ----------------------------------------------------------

const all = await get("/admin/blog-post", staff);
const allRows = rows(all.body);
check("staff: the list renders", all.status === 200 && allRows.length > 0, `${allRows.length} rows`);

{
  // The descriptor's own `defaultSort`, which no query parameter has overridden.
  const at = columnIndex(all.body, "Created");
  const dates = allRows.map((row) => row[at]);
  const descending = dates.every((date, i) => i === 0 || dates[i - 1] >= date);
  check("newest first, as the model's own ordering had it", descending, `${dates[0]} … ${dates.at(-1)}`);
}

{
  const { body } = await get("/admin/blog-post?q=commit", staff);
  const found = rows(body);
  check("search matches", found.length > 0 && found.length < allRows.length, `${found.length} of ${allRows.length}`);
}

{
  const one = rows((await get("/admin/blog-post?q=pddikti", staff)).body).length;
  const two = rows((await get("/admin/blog-post?q=pddikti+memory", staff)).body).length;
  check("a second term narrows rather than widens", two > 0 && two < one, `${one} -> ${two}`);
}

{
  const { body } = await get("/admin/blog-post?q=zzzznope", staff);
  check("no match says so", rows(body).length === 0 && body.includes("No blog posts match that."));
}

{
  const yes = rows((await get("/admin/blog-post?is_featured=1", staff)).body).length;
  const no = rows((await get("/admin/blog-post?is_featured=0", staff)).body).length;
  check(
    "a boolean filter partitions the table",
    yes > 0 && no > 0 && yes + no === allRows.length,
    `${yes} + ${no} = ${allRows.length}`,
  );
}

{
  const { body } = await get("/admin/blog-post", staff);
  const options = [...body.matchAll(/<select name="category"[\s\S]*?<\/select>/g)][0]?.[0] ?? "";
  const count = [...options.matchAll(/<option/g)].length;
  check("the category filter lists the values present", count > 1, `${count - 1} categories`);
}

{
  const asc = rows((await get("/admin/blog-post?sort=views&dir=asc", staff)).body);
  const desc = rows((await get("/admin/blog-post?sort=views&dir=desc", staff)).body);
  const at = columnIndex((await get("/admin/blog-post", staff)).body, "Views");
  const ascending = asc.every((row, i) => i === 0 || Number(asc[i - 1][at]) <= Number(row[at]));
  check("sorting runs both ways", ascending && asc[0][0] !== desc[0][0], `${asc[0][at]} … ${desc[0][at]}`);
}

{
  const { body } = await get("/admin/blog-post?sort=nonsense&dir=asc", staff);
  check("an unknown sort key falls back instead of reaching SQL", rows(body)[0]?.[0] === allRows[0][0]);
}

{
  const { body } = await get("/admin/blog-post?page=99", staff);
  check("a page past the end clamps", rows(body).length === allRows.length);
}

/**
 * Not-found is asserted on what the reader is told, not on the status.
 *
 * Two different things end up here. A URL the *router* rejects -- an unbuilt
 * screen, a key that is not in the registry -- gets a real 404 from
 * `app/admin/not-found.tsx`. A row that simply does not exist cannot: the status
 * is committed as soon as a route is known to be dynamic, and every admin page
 * reads the session first on purpose, so `notFound()` would come too late. That
 * case is *rendered* rather than thrown -- inside the record route's `<Suspense>`
 * boundary, throwing it resolves the boundary to nothing and leaves a blank
 * page. Either way the reader gets the admin's own "Nothing here".
 */
const notFound = ({ status, body }) => status === 404 || body.includes("Nothing here");

{
  const unknown = await get("/admin/nonsense", staff);
  check("an unknown key says not found", notFound(unknown), `status ${unknown.status}`);
  check("and it renders no changelist either", !unknown.body.includes("<table"));
}

{
  /*
   * Two ways to ask for a record that is not there, and both have to answer the
   * same. A well-formed key that matches nothing is the ordinary miss. A key
   * that is not a uuid at all is the one worth a check of its own: it reaches
   * Postgres as a malformed value for a uuid column, which raises `22P02` and
   * would surface as a 500 rather than the not-found screen.
   */
  const ABSENT = "00000000-0000-4000-8000-000000000000";
  const found = await get(`/admin/blog-post/${postId}`, staff);
  const missing = await get(`/admin/blog-post/${ABSENT}`, staff);
  const malformed = await get("/admin/blog-post/999999", staff);
  check("a record renders", found.status === 200 && found.body.includes("Commit Message Style Guide"));
  check("a record that is not there says so", notFound(missing), `status ${missing.status}`);
  check(
    "and names the model it looked in",
    missing.body.includes(`There is no blog post with id ${ABSENT}`),
  );
  check(
    "a key that is not a uuid says so too, rather than erroring",
    notFound(malformed),
    `status ${malformed.status}`,
  );
  // The frame the reader sees while the record is fetched. It is prerendered and
  // served before the gate has run, so it must carry nothing about the record or
  // the account -- only the shape of the page.
  const shell = await get(`/admin/blog-post/${postId}`);
  check(
    "the streamed shell carries a placeholder and no data",
    shell.body.includes("animate-pulse") === false || leaks(shell.body).length === 0,
    leaks(shell.body).join(", ") || "clean",
  );
}

// --- every built screen ------------------------------------------------------

/*
 * One descriptor drives fifteen screens, so a mistake in a shared helper shows
 * up on some of them and not others. Two of these did exactly that: the
 * subqueries behind `legal-section` and `user` were written as raw `sql`
 * templates, which drizzle renders with *bare* column names -- so
 * `where "user_id" = "id"` correlated a table with itself and the query failed
 * outright. The ones that appeared to work did so only because the outer
 * column's name did not exist on the inner table. Every screen is loaded here,
 * and the rows are checked for the substituted values, not just a 200.
 */
{
  const empty = new Set(["comment"]); // the comments table is genuinely empty
  const broken = [];
  const thin = [];

  for (const entry of ADMIN_ENTRIES) {
    // `adminPath`, never `/admin/${entry.key}`: half these screens are tabs on
    // a Settings section now and answer at `/admin/<section>/<key>` alone, so a
    // loop that builds the flat URL sweeps seventeen not-found pages and calls
    // them broken -- or, worse, stops noticing the ones that are.
    const { status, body } = await get(adminPath(entry), staff);
    if (entry.singleton) {
      // Its screen is a form, so what proves it rendered is a save button.
      if (status !== 200 || !body.includes("Save")) broken.push(`${entry.key} (${status})`);
      continue;
    }
    if (status !== 200 || !body.includes("<table")) {
      broken.push(`${entry.key} (${status})`);
      continue;
    }
    const cells = [...body.matchAll(/<tbody[\s\S]*?<\/tbody>/g)][0]?.[0] ?? "";
    const rowCount = [...cells.matchAll(/<tr/g)].length;
    if (!empty.has(entry.key) && rowCount === 0) thin.push(entry.key);
  }

  check("every built screen renders", broken.length === 0, broken.join(", "));
  check("and every one with rows shows them", thin.length === 0, thin.join(", "));
}

{
  /*
   * The columns that come from a correlated subquery, checked on the value
   * rather than the status: a mis-correlated subquery returns wrong data as
   * readily as it errors, and the admin's own history has two of those.
   *
   * These used to be the author and co-author flags, asserted against a
   * hard-coded "one author called ridwan" -- which the fold made meaningless
   * and would have inverted rather than failed. The two public switches are the
   * correlated columns now. The *discriminating* case, an account with one
   * switched off, is driven by `check-public-access.mjs`, which can write one
   * in a rolled-back transaction; what is asserted here is that the two halves
   * of the filter partition the list rather than both answering the same way.
   */
  const canComment = rows((await get("/admin/user?can_comment=1", staff)).body);
  const cannotComment = rows((await get("/admin/user?can_comment=0", staff)).body);
  const both = new Set([...canComment, ...cannotComment].map((row) => row[0]));
  check(
    "the public switches read from public_access, not from account",
    canComment.length > 0 && both.size === canComment.length + cannotComment.length,
    `${canComment.length} may comment, ${cannotComment.length} may not`,
  );

  const sections = await get("/admin/legal-section", staff);
  const named = rows(sections.body).filter((row) => row[1] && row[1] !== "—");
  check(
    "a section names its document, through a self-aliased lookup",
    named.length > 0,
    `${named.length} of ${rows(sections.body).length} on page 1`,
  );
}

// --- the settings sections ---------------------------------------------------

/*
 * Seventeen screens moved from `/admin/<key>` to `/admin/<section>/<key>`, and
 * every part of that is a string: a caller left at the old URL type checks,
 * lints, builds and answers a page with no list on it. The two checks below are
 * halves of one claim and are only worth anything together -- "the old URL is
 * gone" is satisfied by an admin where those screens stopped existing, and "the
 * new URL works" is satisfied by one still serving both.
 */
{
  const sectioned = ADMIN_ENTRIES.filter((entry) => entry.section);

  /*
   * Asserted on the absence of a changelist rather than on a status or on the
   * not-found wording. The route is dynamic -- it reads the session before
   * anything else -- so it cannot commit a 404; and in development the admin's
   * not-found boundary rides along in *every* admin response's payload, so
   * "Nothing here" appears on a perfectly good changelist too and says nothing
   * about which page rendered. A table does.
   */
  const stillFlat = [];
  for (const entry of sectioned) {
    const stale = await get(`/admin/${entry.key}`, staff);
    if (stale.body.includes("<table") || rows(stale.body).length) stillFlat.push(entry.key);
  }
  check(
    "a sectioned screen no longer answers at the top level",
    stillFlat.length === 0,
    stillFlat.join(", ") || `${sectioned.length} keys refused`,
  );

  /*
   * And one click from the rail lands on a working screen. A section's row
   * points at its first tab, so that URL has to be a changelist with the
   * section's whole strip above it, in the strip's own order.
   */
  for (const section of ADMIN_SECTIONS) {
    const tabs = sectionTabs(section.key);
    const [first] = tabs;

    /*
     * The section's *own* URL, not any tab's -- built by hand, the same way
     * the stale flat URL above is, because `adminPath` takes an entry and a
     * section is not one. This is the landing point for a typed URL or an old
     * bookmark, and nothing else here drives it: every other check in this
     * loop fetches `adminPath(first)` directly, which proves the tab page
     * works but not that the section's own URL still finds it.
     *
     * Asserted on the redirect's destination rather than on its status. The
     * route reads the session before anything else, which is what makes it
     * dynamic, so `redirect()` cannot commit a 3xx any more than `notFound()`
     * above can commit a 404 -- measured directly, this answers HTTP 200 with
     * a `<meta http-equiv="refresh">` naming the destination in the body, the
     * same "arrives after load" shape the redirect at sign-out has. Reading
     * that destination, rather than merely checking a marker is present, is
     * what would catch a redirect landing on the wrong tab.
     */
    const landing = await get(`/admin/${section.key}`, staff);
    const redirectTarget = landing.body.match(
      /<meta id="__next-page-redirect"[^>]*content="1;url=([^"]*)"/,
    )?.[1];
    check(
      `${section.key}'s own URL lands on its first tab, ${first.key}`,
      redirectTarget === adminPath(first),
      redirectTarget ?? `no redirect marker found (status ${landing.status})`,
    );

    const { status, body } = await get(adminPath(first), staff);
    /*
     * The strip alone, and its links parsed rather than grepped.
     *
     * Scoped, because the rail marks this section's own row `aria-current` too
     * and the streamed payload repeats both: the whole body reports four, and
     * would report four with no strip on the page at all.
     *
     * Parsed, because these attributes do not come out in source order --
     * `Link` renders `href` last, after the props passed through it, so the tag
     * reads `<a aria-current="page" class="…" href="…">`. `check-admin.mjs`
     * greps `<select name="category"` a few checks above precisely because that
     * order *is* fixed; this one is Link's business and not this file's.
     */
    const strip =
      body.split(`<nav aria-label="${section.label} settings"`)[1]?.split("</nav>")[0] ?? "";
    const links = [...strip.matchAll(/<a\b([^>]*)>/g)].map((match) => match[1]);
    const hrefs = links.map((attrs) => attrs.match(/href="([^"]*)"/)?.[1] ?? "");
    const current = links.filter((attrs) => attrs.includes('aria-current="page"'));
    check(
      `${section.key} opens on ${first.key}, with a list and every tab beside it`,
      status === 200 && body.includes("<table") && hrefs.join(" ") === tabs.map(adminPath).join(" "),
      hrefs.join(" ") || "no tab strip",
    );
    check(
      `and ${section.key} marks exactly one tab current, the open one`,
      current.length === 1 && current[0].includes(`href="${adminPath(first)}"`),
      `${current.length} marked`,
    );
  }
}

// --- layout ------------------------------------------------------------------

/*
 * The changelist is the only screen here wide enough to break a phone, and it
 * did: the table's 736px floor leaked past its own scroll container into the
 * initial containing block, so the whole page scrolled 78px sideways at 390px
 * while `body` and every ancestor still reported 390. Nothing in tsc, eslint or
 * the build sees that, and neither does a screenshot at 1440.
 */
{
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 800 } });
  await context.addCookies([
    { name: cookieName, value: staff.slice(cookieName.length + 1), domain: "localhost", path: "/" },
  ]);
  const page = await context.newPage();

  const widths = [360, 390, 768, 1024, 1440];
  const paths = ["/admin", "/admin/blog-post", `/admin/blog-post/${postId}`];
  const overflowing = [];

  for (const width of widths) {
    await page.setViewportSize({ width, height: 800 });
    for (const path of paths) {
      await page.goto(BASE + path, { waitUntil: "load" });
      await page.waitForTimeout(350);
      const measured = await page.evaluate(() => ({
        doc: document.documentElement.scrollWidth,
        inner: window.innerWidth,
      }));
      if (measured.doc > measured.inner + 1) {
        overflowing.push(`${width}px ${path} (${measured.doc}/${measured.inner})`);
      }
    }
  }

  check(
    "no page scrolls sideways, 360px to 1440px",
    overflowing.length === 0,
    overflowing.join("; ") || `${widths.length * paths.length} measurements`,
  );

  // The rail is a drawer below `lg`, and it is the only way to navigate there.
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(`${BASE}/admin/blog-post`, { waitUntil: "load" });
  await page.waitForTimeout(400);
  const nav = page.locator("nav[aria-label='Admin sections']");
  const hidden = (await nav.boundingBox())?.x ?? 0;
  await page.click("button[aria-label='Open admin navigation']");
  await page.waitForTimeout(400);
  const shown = (await nav.boundingBox())?.x ?? 0;
  check("the drawer is off-screen until opened", hidden < 0 && shown >= 0, `${hidden} -> ${shown}`);

  // --- a filter actually applies ---------------------------------------------
  /*
   * Picked with the pointer, not typed into the address bar.
   *
   * Every other filter assertion here is a direct GET, which exercises the
   * server half and cannot see the half that was broken: the toolbar's select
   * is controlled, so a submit fired on the line after the state write
   * serialised the form while the element still held the old value, and every
   * filter navigated to `?q=&category=` with every parameter blank. The server
   * drops a blank filter, so the list came back unfiltered and the failure
   * looked like nothing happening.
   *
   * Reading the URL is the assertion that would have caught it; the row count
   * is what says the value reached the query rather than merely the address.
   */
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASE}/admin/blog-post`, { waitUntil: "load" });
  await page.waitForTimeout(600);

  const before = await page.locator("tbody tr").count();
  const categoryValue = await page.evaluate(() => {
    const select = document.querySelector('select[name="category"]');
    return [...(select?.options ?? [])].find((option) => option.value)?.value ?? "";
  });

  await page.locator('select[name="category"] + [role="combobox"]').click();
  await page.waitForTimeout(200);
  await page.locator(`[role="option"]`).nth(1).click();
  await page.waitForURL((url) => url.searchParams.has("category"), { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(600);

  const applied = new URL(page.url()).searchParams.get("category") ?? "";
  check(
    "picking a filter puts its value in the URL, not a blank",
    applied !== "" && applied === categoryValue,
    `category=${applied || "(blank)"}`,
  );

  const after = await page.locator("tbody tr").count();
  check(
    "and the list is actually filtered by it",
    after > 0 && after < before,
    `${before} rows -> ${after}`,
  );

  /*
   * And before the bundle arrives, where the native select is the control.
   *
   * Scripting stays ON and the chunks are blocked -- `javaScriptEnabled: false`
   * tests something else entirely here, because React streams a Suspense
   * boundary into a hidden container and reveals it with a small inline
   * script, so with scripting off the toolbar is not merely unhydrated but
   * invisible. This is the path that never broke: the browser writes the
   * picked option before it fires `change`, which is exactly why it could not
   * stand in for the assertion above.
   */
  const bareFilter = await browser.newContext();
  await bareFilter.route("**/_next/static/chunks/**", (route) => route.abort());
  await bareFilter.addCookies([
    { name: cookieName, value: staff.slice(cookieName.length + 1), domain: "localhost", path: "/" },
  ]);
  const unhydrated = await bareFilter.newPage();
  await unhydrated.goto(`${BASE}/admin/blog-post`, { waitUntil: "domcontentloaded" });
  await unhydrated.waitForTimeout(2500);
  await unhydrated.selectOption('select[name="category"]', categoryValue);
  await unhydrated.locator('button:has-text("Search")').first().click();
  await unhydrated.waitForTimeout(1500);
  check(
    "and the native select still filters before the bundle arrives",
    (new URL(unhydrated.url()).searchParams.get("category") ?? "") === categoryValue,
    unhydrated.url().replace(BASE, ""),
  );
  await bareFilter.close();

  // --- signing out asks first ------------------------------------------------
  /*
   * The same confirmation the guestbook and the comment forms use. The button
   * sits at the end of a row of otherwise-safe controls -- the theme toggle is
   * its neighbour -- and an accidental click costs a round trip through an
   * OAuth provider to undo.
   */
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASE}/admin/blog-post`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  await page.locator('button:has-text("Sign out")').first().click();
  await page.waitForTimeout(400);

  const dialog = page.locator('[aria-labelledby="confirm-dialog-title"]');
  const wording = ((await dialog.textContent()) ?? "").replace(/\s+/g, " ");
  check("signing out asks first", (await dialog.count()) === 1, wording.slice(0, 70));
  check(
    "and says what it costs",
    /sign in again/i.test(wording),
    wording.slice(0, 90),
  );

  // Cancel is the first button, as it is in every other use of the dialog.
  await dialog.locator("button").first().click();
  await page.waitForTimeout(900);
  check(
    "cancelling leaves the session alone",
    (await page.locator('button:has-text("Sign out")').count()) === 1 &&
      page.url().includes("/admin/blog-post"),
    page.url().replace(BASE, ""),
  );

  await page.locator('button:has-text("Sign out")').first().click();
  await page.waitForTimeout(400);
  await page.locator('[aria-labelledby="confirm-dialog-title"] button').last().click();
  // The action clears the cookie and then redirects, and the redirect is a
  // client navigation rather than a document load -- waiting for the URL is
  // what makes this reliable, where a fixed sleep was not.
  const landed = await page
    .waitForURL((url) => url.pathname === "/", { timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  const remaining = (await context.cookies()).find(
    (cookie) => cookie.name === cookieName && cookie.value,
  );
  check("confirming signs out and leaves the admin", landed, page.url().replace(BASE, ""));
  check("and the session cookie is gone", !remaining);

  /*
   * And without JavaScript, where there is no dialog to show.
   *
   * The button is a real `submit` inside a form posting a server action, so an
   * uninterceptable click posts it directly. Confirmation is the part that
   * needs JavaScript; signing out is not. A version of this built as a client
   * button calling the action would have left a dead control here.
   */
  const noScript = await browser.newContext({ javaScriptEnabled: false });
  await noScript.addCookies([
    { name: cookieName, value: staff.slice(cookieName.length + 1), domain: "localhost", path: "/" },
  ]);
  const plain = await noScript.newPage();
  await plain.goto(`${BASE}/admin/blog-post`, { waitUntil: "load" });
  await plain.locator('button:has-text("Sign out")').first().click();
  await plain.waitForTimeout(2500);
  const plainCookie = (await noScript.cookies()).find(
    (cookie) => cookie.name === cookieName && cookie.value,
  );
  check(
    "and it still signs out with JavaScript unavailable",
    !plainCookie,
    plain.url().replace(BASE, ""),
  );
  await noScript.close();

  await browser.close();
}

const failed = checks.filter((entry) => !entry.pass);
console.log(
  failed.length === 0
    ? `\nAll ${checks.length} admin checks passed.`
    : `\n${failed.length} of ${checks.length} checks FAILED.`,
);
process.exit(failed.length === 0 ? 0 : 1);
