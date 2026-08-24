/**
 * Every public page renders without the browser or Next.js complaining.
 *
 * `scripts/check-admin-console.mjs` has done this for the admin since phase 3.
 * The public site had no equivalent, and a real fault lived in that gap: after
 * the schema moved to `app`, a reader holding a session minted before the move
 * presented `sub: "1"` -- an integer key, from when they were integers. Sessions
 * are thirty-day JWTs, so *every* signed-in reader was holding one. Comparing a
 * `uuid` column against it raises `22P02 invalid input syntax for type uuid`,
 * which reached the sidebar's admin link as a console error and would have
 * reached the first server action such a reader submitted as a 500.
 *
 * Nothing else saw it. `compare-layout.mjs` measures a signed-out page,
 * `check-comments.mjs` runs against the database rather than the browser, and
 * `tsc` cannot know what a cookie contains. What sees it is a real browser
 * carrying a real token, which is what this is.
 *
 * **Four states, because the bug only existed in one of them.** Signed out,
 * signed in as an ordinary reader, signed in as staff (the sidebar renders an
 * admin link for them and nobody else), and signed in with a token whose
 * subject no longer names anybody -- the last being both the stale-session case
 * and the general "a cookie can say anything" case. A page is expected to be
 * quiet in all four; reverting the guard in `auth.ts` fails the fourth on every
 * one of them.
 *
 * Read-only: it opens pages and writes nothing.
 *
 *   npx tsx --conditions=react-server scripts/check-site-console.mjs [base]
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const { chromium } = await import("playwright");
const { staffAccountId, nonStaffAccountId } = await import("./fixture-ids.mjs");
const { encode } = await import("next-auth/jwt");
const { db } = await import("../lib/db/client.ts");
const { blogPost, legalDocument, project } = await import("../lib/db/app-schema.ts");
const { asc } = await import("drizzle-orm");

const BASE = process.argv[2] ?? "http://localhost:3000";
const COOKIE = "authjs.session-token";

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push(pass);
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

/**
 * Noise a clean page still produces, and which asserting on would only teach
 * the next person to ignore this script.
 *
 * None of it is about the site: the favicon is genuinely absent in dev,
 * Turnstile's widget script logs on load, and the third-party stats the
 * dashboard renders are fetched from GitHub and WakaTime, which are allowed to
 * be slow or down without that being this repository's fault.
 */
const IGNORE = [
  /favicon/i,
  /turnstile/i,
  /Download the React DevTools/i,
  /challenges\.cloudflare\.com/i,
];

/** A detail page of each kind, found rather than pinned to a slug. */
const [post] = await db.select({ slug: blogPost.slug }).from(blogPost).orderBy(asc(blogPost.slug)).limit(1);
const [proj] = await db.select({ slug: project.slug }).from(project).orderBy(asc(project.slug)).limit(1);
const [legal] = await db
  .select({ slug: legalDocument.slug })
  .from(legalDocument)
  .orderBy(asc(legalDocument.slug))
  .limit(1);

const ROUTES = [
  "/",
  "/about",
  "/projects",
  `/projects/${proj.slug}`,
  "/blog",
  `/blog/${post.slug}`,
  "/dashboard",
  "/openhire",
  "/contact",
  "/guestbook",
  "/sign-in",
  "/privacy-policy",
  "/terms",
  `/legal/${legal.slug}`,
  // A slug that does not exist, swept for the opposite reason to the rest: the
  // page must answer "not found" rather than fail. See `EXPECT_MISSING`.
  "/blog/zz-no-such-post",
];

/*
 * Routes whose correct answer is "there is no such thing".
 *
 * Only the response is asserted on. In dev a 404 paints the error overlay and
 * logs the failed request to the console -- both of which are the browser
 * correctly reporting a 404, not the page misbehaving -- so asserting on them
 * would make a working not-found screen permanently red. What is still checked
 * is that the response is not a *server* error, and that the body actually says
 * so: under `cacheComponents` a dynamic route cannot set a 404 status at all
 * (the status is committed the moment the route is known to be dynamic, and
 * reading the session cookie is what makes it so), so the status alone would
 * not catch a page that silently rendered nothing.
 */
const EXPECT_MISSING = new Set(["/blog/zz-no-such-post"]);

const mint = async (sub) =>
  encode({ token: { sub }, secret: process.env.AUTH_SECRET, salt: COOKIE, maxAge: 60 * 30 });

/*
 * `sub: "1"` is not a made-up value. It is what every session token minted
 * before the schema moved actually carries, and what produced the fault this
 * harness was written for.
 */
const STATES = [
  { name: "signed out", token: null },
  { name: "signed in as a reader", token: await mint(await nonStaffAccountId()) },
  { name: "signed in as staff", token: await mint(await staffAccountId()) },
  { name: "holding a pre-migration session", token: await mint("1") },
];

const browser = await chromium.launch();

for (const state of STATES) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  if (state.token) {
    await context.addCookies([
      { name: COOKIE, value: state.token, domain: "localhost", path: "/" },
    ]);
  }

  const faults = [];

  for (const path of ROUTES) {
    // A page each, because the dev overlay counts issues for the lifetime of
    // the page -- one shared page would attribute the first fault to every
    // route after it.
    const page = await context.newPage();
    const noise = [];
    page.on("console", (message) => {
      if (message.type() !== "error") return;
      const text = message.text().split("\n")[0];
      if (!IGNORE.some((pattern) => pattern.test(text))) noise.push(text);
    });
    page.on("pageerror", (error) => noise.push(`uncaught: ${error.message.split("\n")[0]}`));

    const response = await page.goto(BASE + path, { waitUntil: "load" });
    await page.waitForTimeout(1200);

    /*
     * The overlay's own verdict, read from the badge rather than from the
     * console -- an insight is reported there and never printed to the console
     * at all. Insights are *not* asserted on for the site the way they are for
     * the admin: several of these routes read the session deliberately and are
     * dynamic by design, which the overlay reports as an insight and which is
     * the intended shape rather than a fault.
     */
    const readBadge = () =>
      page.evaluate(() => {
        const root = document.querySelector("nextjs-portal")?.shadowRoot;
        const element = root?.querySelector("[data-next-badge]");
        if (!element) return null;
        return { error: element.getAttribute("data-error") === "true" };
      });

    /*
     * Read once, and again if the page moved under us.
     *
     * `/sign-in` sends a reader who already has a session to the home page, and
     * that bounce is a client navigation rather than a 307 -- under
     * `cacheComponents` the status is committed before the session is known, so
     * it cannot be anything else. It can land after the settle above, and
     * evaluating into a context that is being torn down throws rather than
     * returning anything. The retry measures whichever page the reader actually
     * ended up on, which is the one whose console matters.
     */
    const badge = await readBadge().catch(async () => {
      await page.waitForTimeout(1000);
      return readBadge().catch(() => null);
    });

    const status = response?.status() ?? 0;
    const missing = EXPECT_MISSING.has(path);
    const saysMissing = missing
      ? /not found|does not exist|no such/i.test(await page.evaluate(() => document.body.innerText))
      : true;

    const problems = [
      (missing ? status >= 500 : status >= 400) ? `HTTP ${status}` : null,
      !saysMissing ? "answered without saying the record is missing" : null,
      missing || !badge?.error ? null : "the overlay reports an error",
      ...(missing ? [] : noise),
    ].filter(Boolean);

    if (problems.length) faults.push({ path, problems });
    await page.close();
  }

  check(
    `all ${ROUTES.length} pages are quiet, ${state.name}`,
    faults.length === 0,
    faults.map((f) => `${f.path}: ${f.problems[0]}`).join("; ").slice(0, 200),
  );

  for (const fault of faults) {
    for (const problem of fault.problems.slice(0, 3)) {
      console.log(`        ${fault.path}  ${problem.slice(0, 160)}`);
    }
  }

  await context.close();
}

/*
 * And the specific claim the stale-session case is really making: that such a
 * reader is treated as signed out rather than as somebody the database has
 * never heard of. `auth.ts` refuses a subject that is not a uuid, so the header
 * offers a sign-in instead of a sign-out.
 */
{
  const context = await browser.newContext();
  await context.addCookies([
    { name: COOKIE, value: await mint("1"), domain: "localhost", path: "/" },
  ]);
  const page = await context.newPage();
  await page.goto(`${BASE}/guestbook`, { waitUntil: "load" });
  await page.waitForTimeout(900);
  const body = await page.content();
  check(
    "a pre-migration session is offered a sign-in, not treated as signed in",
    /sign in/i.test(body) && !/sign out/i.test(body),
  );
  await context.close();
}

await browser.close();

const failed = checks.filter((pass) => !pass).length;
console.log(
  failed === 0
    ? `\nThe site is quiet across ${ROUTES.length} pages in ${STATES.length} sign-in states.`
    : `\n${failed} check(s) FAILED.`,
);
process.exit(failed === 0 ? 0 : 1);
