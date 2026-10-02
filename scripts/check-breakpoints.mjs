/**
 * Verify the one-visible-theme-toggle invariant across breakpoints.
 *
 * The toggle lives in the top navbar and never hides; the links collapse into
 * the menu button below `lg`, and exactly one toggle must be on screen at any
 * width -- the mobile menu carries none of its own. A breakpoint band
 * with none, or with two, is invisible to tsc, eslint and the build, so this
 * checks it directly in a real browser. The widths bracket every boundary that
 * matters.
 *
 *   node scripts/check-breakpoints.mjs [url]
 */
import { chromium } from "playwright";

const URL = process.argv[2] ?? "http://localhost:3000/";
const WIDTHS = [375, 767, 768, 900, 1023, 1024, 1440];

const browser = await chromium.launch();
const page = await browser.newPage();
let failures = 0;

for (const width of WIDTHS) {
  await page.setViewportSize({ width, height: 900 });
  // `load`, not `networkidle`. Every <Link> in the viewport prefetches its RSC
  // payload (`?_rsc=...`), and navigating to the same URL seven times in a row
  // keeps a fresh batch of those in flight, so the network never goes idle --
  // the same reason the other harnesses in this directory wait on `load`. A
  // fixed settle afterwards covers fonts and layout.
  await page.goto(URL, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(600);

  const counts = await page.evaluate(() => {
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
    };
    const seen = (sel) => [...document.querySelectorAll(sel)].filter(visible).length;
    return {
      toggles: seen("[data-theme-toggle]"),
      // Attribute-substring selectors so the Tailwind class's colon needs no
      // escaping through however many layers of quoting this file travels.
      navbars: seen("header"),
      hamburgers: seen('[aria-label="Open menu"]'),
      searchBoxes: seen('button[aria-label="Search"]'),
    };
  });

  const ok = counts.toggles === 1;
  if (!ok) failures++;
  console.log(
    `  ${ok ? "ok  " : "FAIL"} ${String(width).padStart(4)}px  ` +
      `toggles=${counts.toggles} navbar=${counts.navbars} ` +
      `hamburger=${counts.hamburgers} search=${counts.searchBoxes}`,
  );
}

await browser.close();
console.log(
  failures === 0
    ? "\nExactly one visible toggle at every width."
    : `\n${failures} width(s) wrong.`,
);
process.exit(failures === 0 ? 0 : 1);
