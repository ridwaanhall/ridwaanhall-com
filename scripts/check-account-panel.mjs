/**
 * The sidebar's account panel, checked against the running app.
 *
 * The site had no account chrome at all before this: signing in was reachable
 * only from inside the guestbook or a comment thread, and nothing anywhere said
 * whether anybody was signed in. That is not merely a missing feature -- it is
 * why signing out of the admin, which lands on the home page, was reported as
 * doing nothing. There was no way to tell from the page that it had worked.
 *
 * So what is pinned here is the *visible* answer to "who is this", in both
 * states and at both widths, plus the two things that are easy to break
 * silently:
 *
 * - **The panel is rendered twice per request** -- once by the desktop rail,
 *   once by the mobile drawer -- from one element created in the layout. Both
 *   are in the DOM at every width; exactly one is visible. A count of elements
 *   would pass while the wrong one showed, so these measure visibility.
 * - **`/sign-in` must work before hydration.** Both provider buttons are real
 *   forms posting a server action, and this reads the server body to prove it
 *   rather than the hydrated DOM, which would pass either way.
 *
 * Needs the dev server up, and reads `AUTH_SECRET` to mint a session -- see
 * `mint-session.mjs` for why that is the honest way in.
 *
 *   npx tsx scripts/check-account-panel.mjs [base]
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const { encode } = await import("next-auth/jwt");
const { nonStaffAccountId, staffAccountId } = await import("./fixture-ids.mjs");

const BASE = process.argv[2] ?? "http://localhost:3000";

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push({ name, pass });
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

const cookieName = "authjs.session-token";

/*
 * A reader, not staff, on purpose.
 *
 * The one session-aware thing the chrome already had was the admin link, which
 * only staff ever see. Signing this harness in as staff would let a panel that
 * rendered nothing at all still look right, because the "Admin" bullet would
 * appear beside it.
 */
const mint = (sub) =>
  encode({ token: { sub }, secret: process.env.AUTH_SECRET, salt: cookieName, maxAge: 60 * 10 });

const token = await mint(await nonStaffAccountId());
const staffToken = await mint(await staffAccountId());

console.log("\nAccount panel\n");

const { chromium } = await import("playwright");
const browser = await chromium.launch();

/** How many of a selector are on the page *and* actually visible. */
async function visible(page, selector) {
  const all = page.locator(selector);
  const total = await all.count();
  let shown = 0;
  for (let i = 0; i < total; i++) if (await all.nth(i).isVisible()) shown++;
  return { total, shown };
}

/**
 * Wait until one copy of the control is actually on screen.
 *
 * Not `waitForSelector`: the drawer's copy comes first in the DOM -- the shell
 * renders it before the rail -- so waiting on the selector waits on the *hidden*
 * one and times out at every desktop width. Both copies exist at every width by
 * design; visibility is the whole question.
 */
async function waitVisible(page, selector, timeout = 20000) {
  const deadline = Date.now() + timeout;
  for (;;) {
    if ((await visible(page, selector)).shown > 0) return true;
    if (Date.now() > deadline) return false;
    await page.waitForTimeout(250);
  }
}

/**
 * The measured shape of an account control.
 *
 * `slack` is the whole point: the width the control adds beyond the width of
 * the words inside it. A pill that hugs its label has about twenty pixels of
 * it -- two paddings and two borders -- where one stretched to the column has a
 * hundred and fifty. Measuring the text with a `Range` rather than assuming a
 * character width is what makes that a real number instead of a guess.
 *
 * `round` asks whether the corner radius is at least half the height, which is
 * what "fully rounded" means at any size. Tailwind's `rounded-full` computes to
 * an enormous length rather than to a percentage, so the value cannot be
 * compared against a literal.
 */
async function pillShape(page, selector) {
  return page.evaluate((sel) => {
    const el = [...document.querySelectorAll(sel)].find((node) => node.offsetParent !== null);
    if (!el) return null;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(el);
    const text = range.getBoundingClientRect();
    return {
      shape: [
        `pad ${style.paddingTop} ${style.paddingLeft}`,
        `font ${style.fontSize}`,
        `height ${Math.round(rect.height)}`,
      ].join(", "),
      width: Math.round(rect.width),
      slack: Math.round(rect.width - text.width),
      round: parseFloat(style.borderTopLeftRadius) >= rect.height / 2,
    };
  }, selector);
}

const SIGN_IN = 'a[href="/sign-in"]';
// Named structurally, not by its text: `:has-text()` is Playwright's and does
// not exist in the DOM, and these are measured inside the page.
const SIGN_OUT_PILL = 'div.border-t form button[type="submit"]';
const SIGN_OUT = 'button:has-text("Sign out")';
const ADMIN = 'a[href="/admin"]';

/** Measured signed out, compared against signed in -- hence the outer scope. */
let signedOutPill;
// Both copies are in the DOM at every width and the drawer's comes first, so
// anything that acts on a control -- clicking it, reading its label -- has to
// name the visible one explicitly or it acts on the hidden one.
const SHOWN = (selector) => `${selector}:visible`;

// --- signed out ------------------------------------------------------------
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await waitVisible(page, SIGN_IN);

  const rail = await visible(page, SIGN_IN);
  check(
    "signed out at 1280px: one visible way in, and the drawer's copy hidden",
    rail.shown === 1 && rail.total === 2,
    `${rail.shown} of ${rail.total} visible`,
  );
  check(
    "and it is labelled, not an icon somebody has to guess at",
    /sign in/i.test((await page.locator(SHOWN(SIGN_IN)).first().textContent()) ?? ""),
  );
  check("and nothing offers to sign out", (await visible(page, SIGN_OUT)).shown === 0);

  /*
   * A pill the width of its words, not the width of the column.
   *
   * It was a full-width `h-11` button, which made signing in look like the
   * thing the rail was for. Thirty pixels of slack is generous for two
   * paddings and two borders and nowhere near a stretched control: the rail is
   * 248px, so a full-width one would report about 150.
   */
  signedOutPill = await pillShape(page, SIGN_IN);
  check(
    "and it is a pill the width of its label, not of the rail",
    signedOutPill.slack < 30 && signedOutPill.width < 100,
    `${signedOutPill.width}px wide, ${signedOutPill.slack}px of it not text`,
  );
  check("and it is fully rounded", signedOutPill.round, signedOutPill.shape);

  // The drawer's copy, at a width where the rail is gone.
  await page.setViewportSize({ width: 375, height: 800 });
  await page.reload({ waitUntil: "load" });
  // Nothing to wait *for* here -- the assertion is that neither copy shows --
  // so wait for the panel to have streamed in at all before measuring.
  await page.waitForSelector(SIGN_IN, { state: "attached", timeout: 20000 });
  const shut = await visible(page, SIGN_IN);
  await page.click("button[aria-label='Open Sidebar']");
  await page.waitForTimeout(600);
  const open = await visible(page, SIGN_IN);
  check(
    "signed out at 375px: reachable through the drawer and only there",
    shut.shown === 0 && open.shown === 1,
    `${shut.shown} shut -> ${open.shown} open`,
  );
  await context.close();
}

// --- signed in -------------------------------------------------------------
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addCookies([{ name: cookieName, value: token, domain: "localhost", path: "/" }]);
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await waitVisible(page, SIGN_OUT);

  const out = await visible(page, SIGN_OUT);
  check(
    "signed in: one visible way out, and no way in",
    out.shown === 1 && (await visible(page, SIGN_IN)).shown === 0,
    `${out.shown} of ${out.total} visible`,
  );

  /*
   * The panel names the person. Anything would do here except nothing: a panel
   * that rendered a sign-out button over an empty identity is the failure that
   * still looks fine in a screenshot.
   */
  const named = await page.evaluate(() => {
    const button = [...document.querySelectorAll("button")].find(
      (element) => element.textContent?.trim() === "Sign out" && element.offsetParent !== null,
    );
    const panel = button?.closest("div.border-t");
    return (panel?.textContent ?? "").replace("Sign out", "").trim();
  });
  check("and says who is signed in", named.length > 0 && named.includes("@"), named.slice(0, 40));

  // The two controls are one design. Signing in and signing out are the same
  // kind of act from the reader's side, and a rail that drew them differently
  // would be saying they are not.
  const signedInPill = await pillShape(page, SIGN_OUT_PILL);
  check(
    "and the way out is the same pill as the way in",
    signedInPill.shape === signedOutPill.shape && signedInPill.round,
    signedInPill.shape,
  );
  check(
    "sized to its own label, like that one",
    signedInPill.slack < 30 && signedInPill.width < 100,
    `${signedInPill.width}px wide, ${signedInPill.slack}px of it not text`,
  );

  // A reader is not staff, and the admin is not advertised to them anywhere --
  // not in the panel, and no longer as a bullet in the footer either.
  check("and a reader is offered no admin, anywhere", (await visible(page, ADMIN)).total === 0);

  /*
   * And signing out from here actually ends the session.
   *
   * This is the mechanism the admin's sign-out failed at in a real browser
   * while passing every harness: `signOut({ redirectTo })` redirects to an
   * absolute URL built from `AUTH_URL` rather than the origin the request
   * arrived on. `signOutHere` does its own relative redirect now, and this is
   * where that is pinned from the site's side.
   */
  await page.locator(SHOWN(SIGN_OUT)).first().click();
  await page.waitForTimeout(500);
  await page.locator('[aria-labelledby="confirm-dialog-title"] button').last().click();

  /*
   * Wait on the chrome, not on the URL.
   *
   * Signing out from the sidebar redirects to `/` from `/`, so a
   * `waitForURL(pathname === "/")` is already true and resolves before the
   * action has even been sent -- which then reads the cookie jar too early and
   * reports a session that is about to be cleared as one that never was. The
   * panel flipping back to a sign-in link is the first thing that cannot happen
   * until the round trip is complete.
   */
  const flipped = await waitVisible(page, SIGN_IN);
  check("and the chrome says so without a reload", flipped, page.url().replace(BASE, ""));

  const remaining = (await context.cookies()).find((c) => c.name === cookieName && c.value);
  check("signing out from the sidebar clears the session", !remaining);
  await context.close();
}

// --- signed in as staff ----------------------------------------------------
/*
 * The way into the admin was a bullet after "Terms" in the footer, among the
 * legal links and drawn like one of them. It is an account action, so it sits
 * beside the way out -- same pill, same row, differing only in the hue each
 * reveals on hover.
 *
 * `is_staff` is read from the database on every request and never carried in
 * the token, so this is a real staff account rather than a claim in a cookie.
 */
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addCookies([{ name: cookieName, value: staffToken, domain: "localhost", path: "/" }]);
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await waitVisible(page, ADMIN);

  const admin = await visible(page, ADMIN);
  check(
    "staff: one visible way into the admin, and the drawer's copy hidden",
    admin.shown === 1 && admin.total === 2,
    `${admin.shown} of ${admin.total} visible`,
  );

  // The bare selector, not `SHOWN`: `pillShape` runs inside the page, where
  // `:visible` is not a selector, and it picks the shown copy itself.
  const adminPill = await pillShape(page, ADMIN);
  check(
    "and it is the same pill as the way out, not a footer link",
    adminPill.shape === signedOutPill.shape && adminPill.round && adminPill.slack < 30,
    adminPill.shape,
  );

  /*
   * Side by side, and in that order.
   *
   * Same row is what "beside" means and it is measurable: two controls that
   * wrapped would sit a row apart while every other assertion here still
   * passed. The tolerance is a couple of pixels for sub-pixel layout, not for
   * a second line.
   */
  const laidOut = await page.evaluate(() => {
    const shown = (sel) =>
      [...document.querySelectorAll(sel)].find((node) => node.offsetParent !== null);
    const out = shown('div.border-t form button[type="submit"]')?.getBoundingClientRect();
    const adm = shown('a[href="/admin"]')?.getBoundingClientRect();
    if (!out || !adm) return null;
    return { drop: Math.abs(out.top - adm.top), gap: Math.round(adm.left - out.right) };
  });
  check(
    "and the two sit on one row, sign out first",
    laidOut !== null && laidOut.drop < 2 && laidOut.gap > 0 && laidOut.gap < 24,
    laidOut ? `${laidOut.drop.toFixed(1)}px apart vertically, ${laidOut.gap}px between` : "not found",
  );

  /*
   * The two rules at the bottom of the rail are one weight.
   *
   * Compared against each other rather than against a literal: Tailwind v4
   * emits its palette in a wide-gamut colour space, so Chrome hands back
   * `lab(...)`/`oklab(...)` and the exact string is a representation detail
   * that would make this red for no reason. What is worth pinning is the
   * relationship -- the panel's rule and the footer's agree, so the bottom of
   * the rail reads as two banded sections. Either one changing alone is the
   * drift this catches.
   */
  const rules = await page.evaluate(() => {
    const ruled = (within) =>
      [...document.querySelectorAll("div.border-t")].find(
        (node) => node.offsetParent !== null && node.querySelector(within),
      );
    const panel = ruled('a[href="/admin"]');
    const footer = ruled('a[href="/privacy-policy"]');
    return {
      panel: panel && getComputedStyle(panel).borderTopColor,
      footer: footer && getComputedStyle(footer).borderTopColor,
    };
  });
  check(
    "and its rule is the same weight as the footer's, so the band reads as one",
    Boolean(rules.panel) && rules.panel === rules.footer,
    `${rules.panel} vs footer ${rules.footer}`,
  );

  /*
   * The hue arrives on hover, and it is the hue that was meant.
   *
   * Read against a probe painted from the palette variable rather than against
   * a literal, for the reason the rule above is: Tailwind v4 emits a wide-gamut
   * space and the string form is a representation detail. Comparing two values
   * the browser produced sidesteps it entirely -- and it would still catch the
   * failure worth catching, which is a hover class Tailwind never emitted,
   * leaving the pill grey.
   *
   * Both are asserted because they are the whole point of drawing the two
   * alike: same shape, and the only thing telling them apart is what signing
   * out costs.
   */
  const palette = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.display = "none";
    document.body.appendChild(probe);
    const read = (variable) => {
      probe.style.color = `var(${variable})`;
      return getComputedStyle(probe).color;
    };
    const values = { red: read("--color-red-400"), indigo: read("--color-indigo-400") };
    probe.remove();
    return values;
  });

  /*
   * Two selectors, because the two halves run in different places: the hover is
   * Playwright's and may use `:has-text()`, the read is the page's and may not.
   */
  const hovered = async (hoverSelector, readSelector) => {
    await page.locator(SHOWN(hoverSelector)).first().hover();
    await page.waitForTimeout(400);
    return page.evaluate((sel) => {
      const el = [...document.querySelectorAll(sel)].find((node) => node.offsetParent !== null);
      return el ? getComputedStyle(el).color : null;
    }, readSelector);
  };

  const outHue = await hovered(SIGN_OUT, SIGN_OUT_PILL);
  check("signing out goes red on hover, because it is the one that costs", outHue === palette.red, `${outHue}`);

  const adminHue = await hovered(ADMIN, ADMIN);
  check("and the admin takes its own accent", adminHue === palette.indigo, `${adminHue}`);

  await context.close();
}

// --- /sign-in works before the bundle arrives ------------------------------
{
  const body = await fetch(`${BASE}/sign-in`).then((response) => response.text());
  const forms = body.match(/<form[^>]*method="POST"/gi) ?? [];
  check(
    "the sign-in page posts real forms, hydrated or not",
    forms.length === 2 &&
      body.includes("Continue with Google") &&
      body.includes("Continue with GitHub"),
    `${forms.length} form(s)`,
  );

  // A signed-in reader has no business on a sign-in page.
  const context = await browser.newContext();
  await context.addCookies([{ name: cookieName, value: token, domain: "localhost", path: "/" }]);
  const page = await context.newPage();
  await page.goto(`${BASE}/sign-in`, { waitUntil: "load" });
  /*
   * The bounce is a client navigation, not a 307.
   *
   * Under `cacheComponents` the status is committed as soon as the route is
   * known to be dynamic, and reading the session cookie is what makes it so --
   * the same reason a dynamic route here cannot answer 404. So the response is
   * a 200 whose body carries the redirect, and it lands after `load`. Assert
   * where the browser ends up, never the status.
   */
  const bounced = await page
    .waitForURL((url) => url.pathname === "/", { timeout: 20000 })
    .then(() => true)
    .catch(() => false);
  check(
    "and it does not offer a signed-in reader another one",
    bounced,
    page.url().replace(BASE, ""),
  );
  await context.close();
}

await browser.close();

const failed = checks.filter((entry) => !entry.pass);
console.log(
  failed.length === 0
    ? `\nAll ${checks.length} account panel checks passed.`
    : `\n${failed.length} of ${checks.length} checks FAILED.`,
);
process.exit(failed.length === 0 ? 0 : 1);
