/**
 * The rail: one group open at a time, and a collapse that is remembered.
 *
 * Everything here is state that only exists in a browser, which is why none of
 * the other admin harnesses can see it. `check-admin.mjs` proves the drawer
 * leaves the screen below `lg` and that every screen renders; the nav's actual
 * behaviour -- which group is expanded, whether a closed one is still
 * reachable by Tab, whether the content column follows the rail, whether any of
 * it survives a reload -- is invisible to a fetch, to `tsc` and to the build.
 *
 * Four of these guard a specific way of getting it wrong:
 *
 *   - **Two groups open.** The point of the accordion is that twenty-one
 *     screens do not all have to be on screen at once. Holding a set instead of
 *     a single value is the natural thing to write and quietly restores the
 *     wall it was meant to remove.
 *   - **A closed group still in the tab order.** The panel collapses with
 *     `grid-template-rows: 0fr`, which is invisible and *focusable*: without
 *     `inert` a keyboard reader tabs through twenty-one links they cannot see.
 *     This is the check that would have caught it, because nothing about the
 *     page looks wrong.
 *   - **The column not following the rail.** The rail and the content carry the
 *     same transition class; if only one of them does, collapsing looks like
 *     the page breaking rather than a panel closing.
 *   - **A preference that forgets.** The state is a cookie precisely so the
 *     first paint is right. A reload that comes back expanded means the write
 *     never happened, or the layout is not reading it -- and the failure mode
 *     of the alternative, `localStorage`, is a flash rather than a wrong state,
 *     which is even easier to miss.
 *
 * Read-only: it opens pages, clicks nav controls and writes nothing to the
 * database.
 *
 *   npx tsx scripts/check-admin-nav.mjs [base]
 *
 * Needs the app running (`npm run dev`) and `AUTH_SECRET`, to mint a staff
 * session the same way `check-admin.mjs` does.
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const { encode } = await import("next-auth/jwt");
const { staffAccountId } = await import("./fixture-ids.mjs");

const BASE = process.argv[2] ?? "http://localhost:3000";

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push(pass);
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

const cookieName = "authjs.session-token";
const token = await encode({
  token: { sub: String(await staffAccountId()) },
  secret: process.env.AUTH_SECRET,
  salt: cookieName,
  maxAge: 60 * 10,
});

const { chromium } = await import("playwright");
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await context.addCookies([{ name: cookieName, value: token, domain: "localhost", path: "/" }]);
const page = await context.newPage();

/**
 * The group buttons, which are the accordion's headers and the rail's icons.
 *
 * Anchored on the class rather than on `button[aria-expanded]`. The collapse
 * control is a disclosure too and carries `aria-expanded` for the rail itself,
 * so the looser selector counts nine buttons where there are eight groups --
 * and then reports "one expanded" on a page where nothing is open, which reads
 * as a bug in the accordion rather than in the count.
 */
const groups = () => page.locator("nav[aria-label='Admin sections'] .admin-group-toggle");
const group = (name) => groups().filter({ hasText: name }).first();
const expandedCount = async () =>
  (await groups().evaluateAll((nodes) =>
    nodes.filter((node) => node.getAttribute("aria-expanded") === "true").length,
  )) ?? 0;

/**
 * Start from a known rail.
 *
 * The cookie outlives a context, and a run that collapsed the rail and then
 * failed before restoring it would leave every later assertion measuring the
 * wrong state. Set rather than cleared: "expanded" is the state the rest of
 * this file assumes.
 */
await context.addCookies([
  { name: "admin-rail", value: "full", domain: "localhost", path: "/" },
]);

// --- one group at a time -----------------------------------------------------

await page.goto(`${BASE}/admin`, { waitUntil: "load" });
await page.waitForTimeout(700);

check(
  "the index opens with no group expanded",
  (await expandedCount()) === 0,
  `${await expandedCount()} expanded`,
);

await group("Open to work").click();
await page.waitForTimeout(400);
const afterFirst = await expandedCount();
check("opening a group expands it", afterFirst === 1, `${afterFirst} expanded`);

await group("Legal").click();
await page.waitForTimeout(400);
const afterSecond = await expandedCount();
const legalOpen = (await group("Legal").getAttribute("aria-expanded")) === "true";
const workOpen = (await group("Open to work").getAttribute("aria-expanded")) === "true";
check(
  "opening a second group closes the first",
  afterSecond === 1 && legalOpen && !workOpen,
  `${afterSecond} expanded, legal=${legalOpen} open-to-work=${workOpen}`,
);

/*
 * `inert` is what this is really asking about. The panel is still in the
 * document at zero height, so a link inside it answers `offsetParent` and
 * `getBoundingClientRect` like any other -- focusing it is the only thing that
 * tells the two states apart.
 */
const closedLink = page.locator("#admin-group-open-to-work a").first();
await closedLink.evaluate((node) => node.focus());
const focusedClosed = await page.evaluate(() => document.activeElement?.tagName ?? "");
check(
  "a collapsed group's links cannot take focus",
  focusedClosed !== "A",
  `focus landed on ${focusedClosed || "nothing"}`,
);

const openLink = page.locator("#admin-group-legal a").first();
await openLink.evaluate((node) => node.focus());
const focusedOpen = await page.evaluate(() => document.activeElement?.tagName ?? "");
check("and an expanded group's links can", focusedOpen === "A", `focus landed on ${focusedOpen}`);

// --- the group of the screen you are on --------------------------------------

await page.goto(`${BASE}/admin/legal-document`, { waitUntil: "load" });
await page.waitForTimeout(700);
check(
  "arriving on a screen opens the group it is in",
  (await group("Legal").getAttribute("aria-expanded")) === "true" &&
    (await expandedCount()) === 1,
  `${await expandedCount()} expanded`,
);

// --- collapsing the rail -----------------------------------------------------

const railWidth = () =>
  page.locator("nav[aria-label='Admin sections']").evaluate((node) => node.getBoundingClientRect().width);
/** Where the content actually starts, which is the half a width cannot show. */
const contentLeft = () =>
  page.locator("main").evaluate((node) => node.getBoundingClientRect().left);

const wideRail = await railWidth();
const wideContent = await contentLeft();

await page.click("button[aria-label='Collapse the sidebar']");
// Longer than the 260ms transition, so this measures where it settled rather
// than a frame somewhere in the middle of it.
await page.waitForTimeout(700);

const miniRail = await railWidth();
const miniContent = await contentLeft();

check(
  "collapsing narrows the rail",
  miniRail < wideRail - 100,
  `${Math.round(wideRail)}px -> ${Math.round(miniRail)}px`,
);
check(
  "and the content column follows it",
  Math.abs(wideContent - miniContent - (wideRail - miniRail)) < 4,
  `${Math.round(wideContent)}px -> ${Math.round(miniContent)}px`,
);

// --- and it is remembered ----------------------------------------------------

await page.reload({ waitUntil: "load" });
// No settle: the point is that it is *already* narrow, not that it animates to
// narrow. A generous wait here would pass on a rail that painted wide and then
// snapped, which is exactly the failure the cookie exists to prevent.
await page.waitForTimeout(250);
const reloadedRail = await railWidth();
check(
  "and the collapse survives a reload, without painting wide first",
  Math.abs(reloadedRail - miniRail) < 4,
  `${Math.round(reloadedRail)}px`,
);

// --- the collapsed rail is still a way to navigate ---------------------------

await group("Legal").hover();
await page.waitForTimeout(400);
const flyout = page.locator("body > .admin-popover");
const flyoutLinks = await flyout.locator("a").count();
check(
  "hovering a collapsed group opens its entries beside it",
  (await flyout.count()) === 1 && flyoutLinks === 2,
  `${flyoutLinks} entries`,
);

const flyoutBox = await flyout.boundingBox();
check(
  "and the menu is beside the rail rather than under it",
  flyoutBox !== null && flyoutBox.x >= miniRail,
  flyoutBox ? `x=${Math.round(flyoutBox.x)} rail=${Math.round(miniRail)}` : "no box",
);

// --- and a finger is not a cursor --------------------------------------------

/*
 * A touch fires `pointerenter` on tap and `pointerleave` on lift. Wire the
 * flyout to those without asking `pointerType` and a tap opens the menu, the
 * click that follows toggles it shut, and the collapsed rail is unusable on any
 * touch screen wide enough to *have* a rail -- a tablet held in landscape.
 * Nothing about it looks wrong with a mouse, which is the only way it ever gets
 * tried.
 */
{
  const touch = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    hasTouch: true,
  });
  await touch.addCookies([
    { name: cookieName, value: token, domain: "localhost", path: "/" },
    { name: "admin-rail", value: "mini", domain: "localhost", path: "/" },
  ]);
  const tapPage = await touch.newPage();
  await tapPage.goto(`${BASE}/admin/blog-post`, { waitUntil: "load" });
  await tapPage.waitForTimeout(900);

  const legal = tapPage
    .locator("nav[aria-label='Admin sections'] .admin-group-toggle")
    .filter({ hasText: "Legal" })
    .first();

  /*
   * The pause is the whole check, and without it this cannot fail.
   *
   * Playwright's `tap()` delivers enter, down, up and click in one turn, so
   * React never re-renders in between and the click handler still closes over
   * `flyout === null` -- it opens a menu that is already open, and the bug
   * looks fixed whether it is or not. A finger takes tens of milliseconds
   * between arriving and releasing, which is long enough for the state to
   * commit, and it is that render that makes the click read as a toggle.
   *
   * `pointerover`, not `pointerenter`: React derives enter and leave from the
   * bubbling pair at the root, so a hand-dispatched `pointerenter` reaches no
   * handler at all.
   */
  await legal.evaluate((node) =>
    node.dispatchEvent(new PointerEvent("pointerover", { pointerType: "touch", bubbles: true })),
  );
  await tapPage.waitForTimeout(300);
  await legal.tap();
  // Long enough to outlast the 140ms close delay, so a menu that was going to
  // shut itself has had every chance to.
  await tapPage.waitForTimeout(600);

  const open = await tapPage.locator("body > .admin-popover").count();
  check("tapping a collapsed group opens its menu and leaves it open", open === 1, `${open} open`);
  await touch.close();
}

// --- put it back -------------------------------------------------------------

await page.click("button[aria-label='Expand the sidebar']");
await page.waitForTimeout(700);
check(
  "expanding puts the rail back",
  Math.abs((await railWidth()) - wideRail) < 4,
  `${Math.round(await railWidth())}px`,
);

// --- below `lg` it is a drawer, and the collapse does not apply --------------

/*
 * The collapsed state is a cookie, and a cookie has no opinion about width. A
 * phone reading `mini` must still get the 16rem drawer with every label
 * legible -- otherwise the same preference that tidies a desktop rail leaves a
 * touch reader with eight unlabelled icons.
 */
await context.addCookies([
  { name: "admin-rail", value: "mini", domain: "localhost", path: "/" },
]);
await page.setViewportSize({ width: 390, height: 800 });
await page.goto(`${BASE}/admin/blog-post`, { waitUntil: "load" });
await page.waitForTimeout(700);

await page.click("button[aria-label='Open admin navigation']");
await page.waitForTimeout(500);

const drawerWidth = await railWidth();
check("below `lg` the drawer ignores the collapse", drawerWidth > 200, `${Math.round(drawerWidth)}px`);

const labelShown = await group("Legal")
  .locator(".admin-rail-label")
  .evaluate((node) => Number(getComputedStyle(node).opacity));
check("and its labels are legible", labelShown === 1, `opacity ${labelShown}`);

await context.addCookies([
  { name: "admin-rail", value: "full", domain: "localhost", path: "/" },
]);

await browser.close();

const failed = checks.filter((pass) => !pass).length;
console.log(
  failed === 0
    ? `\nAll ${checks.length} nav checks passed.`
    : `\n${failed} of ${checks.length} failed.`,
);
process.exit(failed ? 1 : 0);
