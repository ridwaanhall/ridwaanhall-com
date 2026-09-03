/**
 * Two pieces of interaction state with no live counterpart to compare against.
 *
 * Both broke once in a way that looked like a design choice rather than a bug,
 * which is why they are worth a script:
 *
 * **The palette must mark nothing until you ask it to.** It used to highlight
 * the first navigable row on open, putting the hover wash on Home before the
 * pointer had gone near it -- or on Dashboard when you were already on Home,
 * since the current page is skipped. Hovering, arrowing and typing each mark a
 * row; opening does not.
 *
 * **The Turnstile widget must follow the site's theme.** Left to itself the script
 * choose, which is Turnstile's `auto` -- and `auto` follows the *operating
 * system*, the one signal this site never consults. The theme is passed
 * explicitly now, and because a widget reads it only at creation, a change
 * means tearing the old one down and building a new one. This checks that
 * happens and that exactly one widget survives it: leaking a second would send
 * two tokens and fail verification.
 *
 *   node scripts/check-ui-state.mjs [base]
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3000";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });

const results = [];
const check = (name, pass, detail = "") => {
  results.push({ name, pass });
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

const marked = () => page.locator("#search-modal li.highlighted").count();
// The rail's button, not the drawer's -- both exist in the DOM at this width.
const openPalette = () => page.locator('button:has-text("Search")').last().click();

// --- the search palette ------------------------------------------------------
await page.goto(`${BASE}/about`, { waitUntil: "load" });
await page.waitForTimeout(1200);
await openPalette();
await page.waitForTimeout(600);

check("opening marks nothing", (await marked()) === 0);

await page.hover("#search-modal li:nth-child(2)");
await page.waitForTimeout(200);
check("hovering a row marks it", (await marked()) === 1);

await page.hover("#search-modal input");
await page.waitForTimeout(200);
check("taking the pointer off clears it", (await marked()) === 0);

await page.fill("#search-modal input", "dash");
await page.waitForTimeout(300);
const typed = (await page.locator("#search-modal li.highlighted").first().textContent()) ?? "";
check("typing marks the first match, so Enter goes somewhere", typed.includes("Dashboard"), typed.trim().slice(0, 18));

await page.fill("#search-modal input", "");
await page.waitForTimeout(300);
check("clearing the query unmarks again", (await marked()) === 0);

/*
 * The palette can reach the content, not only the furniture.
 *
 * It indexed pages, socials and CV links -- everything the site has except the
 * two things it is made of -- so a reader who remembered a post's title had no
 * way to get to it from here. The rows arrive from `/api/search` on the first
 * open, so this is also the check that the fetch happened at all: without it
 * the palette still works and simply never finds anything, which is exactly how
 * it behaved before and reads as nothing being wrong.
 */
/*
 * By section heading and row count, because a row here is a `li` with a click
 * handler rather than an anchor -- this palette navigates through the router.
 * Two earlier drafts of this asked for `a[href^="/blog/"]`, found nothing, and
 * one of them still passed, because a `:below(heading)` selector counts every
 * row beneath it including the next section's.
 */
const paletteText = await page.locator("#search-modal").innerText();
check("the palette lists posts", paletteText.includes("POSTS"));
check("and projects", paletteText.includes("PROJECTS"));

/*
 * The title is read from the endpoint the palette itself reads, so this does
 * not carry a copy of somebody's post title that goes stale the day it is
 * renamed. What it proves is the join: a title the API serves is a title the
 * palette can be made to highlight.
 */
const catalogue = await (await fetch(`${BASE}/api/search`)).json();
const sample = catalogue?.data?.posts?.[0]?.title ?? "";
check("the palette's source lists at least one post", sample.length > 0, sample);

await page.fill("#search-modal input", sample.slice(0, 18));
await page.waitForTimeout(400);
const found = (await page.locator("#search-modal li.highlighted").first().textContent()) ?? "";
check(
  "and typing a post's title marks that post",
  found.toLowerCase().includes(sample.slice(0, 18).toLowerCase()),
  found.trim().slice(0, 32),
);

await page.fill("#search-modal input", "");
await page.waitForTimeout(300);

await page.keyboard.press("Escape");
await page.waitForTimeout(400);

// The current page is skipped, so on Home the first navigable row is Dashboard
// -- the case where the phantom highlight landed somewhere even less expected.
await page.goto(`${BASE}/`, { waitUntil: "load" });
await page.waitForTimeout(1000);
await openPalette();
await page.waitForTimeout(600);
check("nothing marked on the home page either", (await marked()) === 0);
await page.keyboard.press("Escape");

// --- the Turnstile widget ----------------------------------------------------
const widgetId = () => page.getAttribute('input[name="cf-turnstile-response"]', "id");
const widgetCount = () => page.locator('input[name="cf-turnstile-response"]').count();

await page.goto(`${BASE}/contact`, { waitUntil: "load" });
// `attached`, not visible: the response input is `type="hidden"` by design.
await page.waitForSelector('input[name="cf-turnstile-response"]', { state: "attached", timeout: 25000 });
await page.waitForTimeout(1500);

const first = await widgetId();
check("a widget is rendered", Boolean(first), first ?? "");
check("the site starts dark", (await page.getAttribute("html", "data-theme")) === "dark");

await page.locator("[data-theme-toggle]").last().click();
await page.waitForTimeout(2500);
check("the site switches to light", (await page.getAttribute("html", "data-theme")) === "light");

const second = await widgetId();
check("the widget is recreated for the new theme", Boolean(second) && second !== first, `${first} -> ${second}`);
check("and only one survives", (await widgetCount()) === 1);

await page.locator("[data-theme-toggle]").last().click();
await page.waitForTimeout(2500);
const third = await widgetId();
check("recreated again on the way back", Boolean(third) && third !== second, `${second} -> ${third}`);
check("still only one", (await widgetCount()) === 1);

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(
  failed.length === 0
    ? `\nAll ${results.length} interaction checks passed.`
    : `\n${failed.length} of ${results.length} checks FAILED.`,
);
process.exit(failed.length === 0 ? 0 : 1);
