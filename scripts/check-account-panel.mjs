/**
 * The sidebar's account row, checked against the running app.
 *
 * The site had no account chrome at all before this: signing in was reachable
 * only from inside the guestbook or a comment thread, and nothing anywhere said
 * whether anybody was signed in. That is not merely a missing feature -- it is
 * why signing out of the admin, which lands on the home page, was reported as
 * doing nothing. There was no way to tell from the page that it had worked.
 *
 * So what is pinned here is the *visible* answer to "who is this", in both
 * states and at both widths, plus the things that are easy to break silently:
 *
 * - **Signed in, the row naming the reader is the button that opens their
 *   menu.** Sign out and Admin live inside it, so every assertion about them
 *   has to open it first -- and the ones about the row itself have to hold
 *   while it is shut.
 * - **Signed out it is a plain link, and stays one.** That is what most readers
 *   get and the only control here that works with no script, so its shape is
 *   measured rather than merely found.
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
 * rendered nothing at all still look right, because the "Admin" row would
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
 * The measured shape of the signed-out control.
 *
 * `slack` is the whole point: the width the control adds beyond the width of
 * the words inside it. A pill that hugs its label has about twenty pixels of
 * it -- two paddings and two borders -- where one stretched to the column has a
 * hundred and fifty. Measuring the text with a `Range` rather than assuming a
 * character width is what makes that a real number instead of a guess.
 *
 * `round` asks whether the corner radius is at least half the height, which is
 * what "fully rounded" means at any size. Tailwind's fully-rounded utility
 * computes to an enormous length rather than to a percentage, so the value
 * cannot be compared against a literal.
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
// The account row. Named by an attribute rather than by its shape: it is the
// one control here whose markup is meant to change with the design, and every
// assertion about the menu has to find it in order to open one.
const TRIGGER = "[data-account-menu]";
// Named structurally, not by its text: `:has-text()` is Playwright's and does
// not exist in the DOM, and these are measured inside the page.
const SIGN_OUT_ROW = 'div.border-t form button[type="submit"]';
const SIGN_OUT = 'button:has-text("Sign out")';
const ADMIN = 'a[href="/admin"]';

// Both copies are in the DOM at every width and the drawer's comes first, so
// anything that acts on a control -- clicking it, reading its label -- has to
// name the visible one explicitly or it acts on the hidden one.
const SHOWN = (selector) => `${selector}:visible`;

/** Open the account menu and give its rows a moment to arrive. */
async function openMenu(page) {
  await page.locator(SHOWN(TRIGGER)).first().click();
  await page.waitForTimeout(300);
}

const expanded = (page) => page.locator(SHOWN(TRIGGER)).first().getAttribute("aria-expanded");

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
  check("and there is no account row to open", (await visible(page, TRIGGER)).total === 0);

  /*
   * A pill the width of its words, not the width of the column.
   *
   * It was a full-width `h-11` button, which made signing in look like the
   * thing the rail was for. Thirty pixels of slack is generous for two
   * paddings and two borders and nowhere near a stretched control: the rail is
   * 248px, so a full-width one would report about 150.
   */
  const signedOutPill = await pillShape(page, SIGN_IN);
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
  await waitVisible(page, TRIGGER);

  const rows = await visible(page, TRIGGER);
  check(
    "signed in: one visible account row, and the drawer's copy hidden",
    rows.shown === 1 && rows.total === 2,
    `${rows.shown} of ${rows.total} visible`,
  );
  check("and nothing offers to sign in", (await visible(page, SIGN_IN)).shown === 0);

  /*
   * The row names the person. Anything would do here except nothing: a menu
   * offered over an empty identity is the failure that still looks fine in a
   * screenshot.
   */
  const named = ((await page.locator(SHOWN(TRIGGER)).first().textContent()) ?? "").trim();
  check("and says who is signed in", named.length > 0 && named.includes("@"), named.slice(0, 40));

  /*
   * Shut to begin with, and shut is a claim the row makes out loud.
   *
   * A menu that rendered its rows and merely painted over them is the failure
   * this catches: they would be reachable by Tab and read out by a screen
   * reader while the row said it was collapsed.
   */
  check(
    "and the way out starts behind it, not beside it",
    (await visible(page, SIGN_OUT)).shown === 0 && (await expanded(page)) === "false",
  );

  await openMenu(page);
  check(
    "opening the row reveals the way out",
    (await visible(page, SIGN_OUT)).shown === 1 && (await expanded(page)) === "true",
  );

  /*
   * Escape is the one dismissal that has to put focus back, because it is the
   * one a reader presses without having pointed anywhere else to put it. The
   * rows leave the tab order at the same moment, which is what hiding them
   * rather than fading them buys.
   */
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  const restored = await page.evaluate(
    () => document.activeElement?.hasAttribute("data-account-menu") ?? false,
  );
  check(
    "and Escape closes it and hands focus back to the row",
    (await visible(page, SIGN_OUT)).shown === 0 && (await expanded(page)) === "false" && restored,
    restored ? "" : "focus was not returned",
  );

  // A reader is not staff, and the admin is not advertised to them anywhere --
  // not in the menu, and no longer as a bullet in the small print either. The
  // menu is not merely hiding one: there is no such link in the document.
  check("and a reader is offered no admin, anywhere", (await visible(page, ADMIN)).total === 0);

  /*
   * And signing out from here actually ends the session.
   *
   * This is the mechanism the admin's sign-out failed at in a real browser
   * while passing every harness: `signOut({ redirectTo })` redirects to an
   * absolute URL built from `AUTH_URL` rather than the origin the request
   * arrived on. `signOutHere` does its own relative redirect now, and this is
   * where that is pinned from the site's side.
   *
   * It also proves the menu hides its rows rather than unmounting them. The
   * button captures its form, waits for the confirm dialog, and only then asks
   * that form to submit -- so a form taken out of the document while the dialog
   * was open is one that last call does nothing to, silently.
   */
  await openMenu(page);
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
   * row flipping back to a sign-in link is the first thing that cannot happen
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
 * The way into the admin was a bullet after "Terms" in the small print, among
 * the legal links and drawn like one of them. It is an account action, so it
 * sits with the other one, in the menu the account row opens -- above it,
 * because the act that throws something away goes last.
 *
 * `is_staff` is read from the database on every request and never carried in
 * the token, so this is a real staff account rather than a claim in a cookie.
 */
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addCookies([
    { name: cookieName, value: staffToken, domain: "localhost", path: "/" },
  ]);
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await waitVisible(page, TRIGGER);

  check(
    "staff: the admin waits behind the account row rather than beside it",
    (await visible(page, ADMIN)).shown === 0,
  );

  await openMenu(page);
  const admin = await visible(page, ADMIN);
  check(
    "and opening it offers one way in, the drawer's copy hidden",
    admin.shown === 1 && admin.total === 2,
    `${admin.shown} of ${admin.total} visible`,
  );

  /*
   * Stacked, and in that order.
   *
   * A menu is a list, so its rows share a left edge -- two that drifted apart
   * would read as two different kinds of thing while every other assertion here
   * still passed. The tolerance is a couple of pixels for sub-pixel layout, not
   * for an indent.
   */
  const laidOut = await page.evaluate(() => {
    const shown = (sel) =>
      [...document.querySelectorAll(sel)].find((node) => node.offsetParent !== null);
    const out = shown('div.border-t form button[type="submit"]')?.getBoundingClientRect();
    const adm = shown('a[href="/admin"]')?.getBoundingClientRect();
    if (!out || !adm) return null;
    return { drift: Math.abs(adm.left - out.left), gap: Math.round(out.top - adm.bottom) };
  });
  check(
    "and the two are stacked on one edge, admin above",
    laidOut !== null && laidOut.drift < 2 && laidOut.gap >= 0 && laidOut.gap < 16,
    laidOut ? `${laidOut.drift.toFixed(1)}px of drift, ${laidOut.gap}px between` : "not found",
  );

  /*
   * One ruled band at the base of the sidebar, holding both.
   *
   * This used to be two -- the account, then the legal links -- each with a
   * rule of its own, in a weight found nowhere else on the site so that the
   * pair would read as banding rather than as an edge and a smudge. One band
   * needs no such trick, and this is what says the two have not drifted apart
   * again: the section carrying the account is the same element that carries
   * the small print.
   */
  const base = await page.evaluate(() => {
    const bands = [...document.querySelectorAll("div.border-t")].filter(
      (node) => node.offsetParent !== null && node.querySelector("[data-account-menu]"),
    );
    return {
      count: bands.length,
      holdsSmallPrint:
        bands.length === 1 && Boolean(bands[0].querySelector('a[href="/privacy-policy"]')),
    };
  });
  check(
    "and the account and the small print share one ruled band",
    base.count === 1 && base.holdsSmallPrint,
    base.count === 1 && !base.holdsSmallPrint
      ? "one band, without the legal links"
      : `${base.count} band(s)`,
  );

  /*
   * The hue arrives on hover, and it is the hue that was meant.
   *
   * Read against a probe painted from the palette variable rather than against
   * a literal: Tailwind v4 emits a wide-gamut space and the string form is a
   * representation detail that would make this red for no reason. Comparing two
   * values the browser produced sidesteps it entirely -- and it would still
   * catch the failure worth catching, which is a hover class Tailwind never
   * emitted, leaving the row grey.
   *
   * Both are asserted because they are the whole point of drawing the two
   * alike: same row, and the only thing telling them apart is what signing out
   * costs.
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

  const outHue = await hovered(SIGN_OUT, SIGN_OUT_ROW);
  check(
    "signing out goes red on hover, because it is the one that costs",
    outHue === palette.red,
    `${outHue}`,
  );

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
