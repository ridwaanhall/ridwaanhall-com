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
 * Django's changelist had: a two-word search narrows rather than widens, a
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
const { ADMIN_ENTRIES } = await import("../lib/admin/registry.ts");
const { ADMIN_LIST_MODELS } = await import("../lib/admin/models/index.ts");

const BASE = process.argv[2] ?? "http://localhost:3000";

/** A staff superuser, and a signed-in reader who is not staff. */
const STAFF_ID = 1;
const NON_STAFF_ID = 4;

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
  if (body.includes("No blog posts")) return [];
  return [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((match) =>
    [...match[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((cell) =>
      cell[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    ),
  );
}

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

// --- the registry ------------------------------------------------------------

{
  const ready = ADMIN_ENTRIES.filter((entry) => entry.ready).map((entry) => entry.key);
  const built = Object.keys(ADMIN_LIST_MODELS);
  const readyWithoutModel = ready.filter((key) => !built.includes(key));
  const modelWithoutEntry = built.filter((key) => !ready.includes(key));
  check(
    "every screen marked ready has a descriptor",
    readyWithoutModel.length === 0,
    readyWithoutModel.join(", "),
  );
  check(
    "every descriptor has a screen marked ready",
    modelWithoutEntry.length === 0,
    modelWithoutEntry.join(", "),
  );
  check(
    "registry keys are unique",
    new Set(ADMIN_ENTRIES.map((entry) => entry.key)).size === ADMIN_ENTRIES.length,
  );
}

// --- the changelist ----------------------------------------------------------

const all = await get("/admin/blog-post", staff);
const allRows = rows(all.body);
check("staff: the list renders", all.status === 200 && allRows.length > 0, `${allRows.length} rows`);

{
  // `ordering = ["-created_at"]` on the model, carried across as the default.
  const dates = allRows.map((row) => row[4]);
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
  const ascending = asc.every((row, i) => i === 0 || Number(asc[i - 1][3]) <= Number(row[3]));
  check("sorting runs both ways", ascending && asc[0][0] !== desc[0][0], `${asc[0][3]} … ${desc[0][3]}`);
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
  // Taken from the registry rather than hard-coded, so finishing a screen
  // cannot quietly turn this into a check that the screen 404s.
  const pending = ADMIN_ENTRIES.find((entry) => !entry.ready);
  const unbuilt = pending ? await get(`/admin/${pending.key}`, staff) : null;
  const unknown = await get("/admin/nonsense", staff);

  if (unbuilt) {
    check(
      `a registered but unbuilt screen says not found (${pending.key})`,
      notFound(unbuilt),
      `status ${unbuilt.status}`,
    );
    check("and it renders no changelist", !unbuilt.body.includes("<table"));
  }
  check("an unknown key says not found", notFound(unknown), `status ${unknown.status}`);
  check("and it renders no changelist either", !unknown.body.includes("<table"));
}

{
  const found = await get("/admin/blog-post/20", staff);
  const missing = await get("/admin/blog-post/999999", staff);
  check("a record renders", found.status === 200 && found.body.includes("Commit Message Style Guide"));
  check("a record that is not there says so", notFound(missing), `status ${missing.status}`);
  check(
    "and names the model it looked in",
    missing.body.includes("There is no blog post with id 999999"),
  );
  // The frame the reader sees while the record is fetched. It is prerendered and
  // served before the gate has run, so it must carry nothing about the record or
  // the account -- only the shape of the page.
  const shell = await get("/admin/blog-post/20");
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

  for (const entry of ADMIN_ENTRIES.filter((candidate) => candidate.ready)) {
    const { status, body } = await get(`/admin/${entry.key}`, staff);
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
  // The two screens whose columns come from a correlated subquery, checked on
  // the value rather than the status: a mis-correlated subquery returns wrong
  // data as readily as it errors.
  const authors = await get("/admin/user?is_author=1", staff);
  const coAuthors = await get("/admin/user?is_co_author=1", staff);
  const authorRows = rows(authors.body);
  const coAuthorRows = rows(coAuthors.body);
  check(
    "the author flag reads from guestbook_userprofile, not auth_user",
    authorRows.length === 1 && authorRows[0][0] === "ridwan",
    authorRows.map((row) => row[0]).join(", "),
  );
  check(
    "and so does the co-author flag",
    coAuthorRows.length === 2 && !coAuthorRows.some((row) => row[0] === "ridwan"),
    coAuthorRows.map((row) => row[0]).join(", "),
  );

  const sections = await get("/admin/legal-section", staff);
  const named = rows(sections.body).filter((row) => row[1] && row[1] !== "—");
  check(
    "a section names its document, through a self-aliased lookup",
    named.length > 0,
    `${named.length} of ${rows(sections.body).length} on page 1`,
  );
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
  const paths = ["/admin", "/admin/blog-post", "/admin/blog-post/20"];
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

  await browser.close();
}

const failed = checks.filter((entry) => !entry.pass);
console.log(
  failed.length === 0
    ? `\nAll ${checks.length} admin checks passed.`
    : `\n${failed.length} of ${checks.length} checks FAILED.`,
);
process.exit(failed.length === 0 ? 0 : 1);
