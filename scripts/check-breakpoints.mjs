/**
 * Verify the navbar holds together at every breakpoint boundary.
 *
 * Three things, none of which tsc, eslint or the build can see:
 *
 * **Exactly one theme toggle is visible.** This is now structural rather than a
 * coincidence -- there is one toggle in the document, in the navbar, and the
 * drawer deliberately has none. It is still checked, because the way it stops
 * being true is somebody adding a second copy somewhere it looks needed.
 *
 * **Exactly one way to reach the navigation.** The inline row from `lg` up, the
 * hamburger below it. Two `hidden` rules that are not exactly complementary give
 * a band with both -- which reads as a mistake -- or a band with neither, which
 * is a site nobody can navigate. Nothing else reports that.
 *
 * **The row never wraps.** What the navbar carries is decided by width: links
 * from `lg`, the name and the spelled-out search box from `xl`, the availability
 * chips from `2xl`. Those thresholds were chosen by measuring glyph advances,
 * which is an estimate -- this is the assertion that makes them a fact. A row
 * that overflows is what an estimate being wrong looks like, and it is invisible
 * to every other check here.
 *
 * **And it never wraps with all three availability chips set either.** That is
 * measured against a probe rather than against the profile, because the live
 * profile has none of the three flags on -- so the widest thing the row can be
 * asked to hold is a thing this page never renders. `status-badges.tsx` says all
 * three at once is the case to test before judging any change to them; it is also
 * the case that would ship broken and only surface the day somebody ticks a box
 * in the admin.
 *
 * **And the navbar, the footer and the page share one measure.** All three carry
 * the same cap and the same gutter, each on a single element -- written as a cap
 * wrapping a padded child instead, the chrome's contents would sit a gutter's
 * width inside the page's, and the three left edges would part company on any
 * screen wide enough to reach the cap. Which is to say: not on a laptop, and
 * visibly on a monitor.
 *
 * The widths bracket every boundary that matters, on both sides.
 *
 *   node scripts/check-breakpoints.mjs [url]
 */
import { chromium } from "playwright";

const URL = process.argv[2] ?? "http://localhost:3000/";
const WIDTHS = [375, 767, 768, 900, 1023, 1024, 1279, 1280, 1360, 1440, 1535, 1536];

/** The row is `h-14 lg:h-16`, so anything above 64px is a second line. */
const ROW_MAX_HEIGHT = 64;

const browser = await chromium.launch();
const page = await browser.newPage();
let failures = 0;

for (const width of WIDTHS) {
  await page.setViewportSize({ width, height: 900 });
  // `load`, not `networkidle`. Every <Link> in the viewport prefetches its RSC
  // payload (`?_rsc=...`), and navigating to the same URL a dozen times in a row
  // keeps a fresh batch of those in flight, so the network never goes idle --
  // the same reason the other harnesses in this directory wait on `load`. A
  // fixed settle afterwards covers fonts and layout.
  await page.goto(URL, { waitUntil: "load", timeout: 60000 });
  // The page's own content column, not just the shell: the alignment check
  // measures against it, and a `loading.tsx` skeleton is still on screen for a
  // moment after `load` -- which would leave nothing to compare the chrome to
  // and read as a misalignment rather than as a measurement taken too early.
  await page.waitForSelector("#page-content main > div", { timeout: 30000 });
  await page.waitForTimeout(600);

  const counts = await page.evaluate(() => {
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
    };
    const seen = (sel) => [...document.querySelectorAll(sel)].filter(visible).length;
    const row = document.querySelector("[data-navbar-row]");
    return {
      toggles: seen("[data-theme-toggle]"),
      // The navbar by its attribute, not by its tag: a blog post renders a
      // `<header>` of its own inside its `<article>`.
      navbars: seen("[data-site-navbar]"),
      // Every navigable row of the inline nav. The current page is a
      // `role="button"` rather than a link, so counting anchors alone would
      // report one fewer and, on a one-item nav, none at all.
      inlineNav: seen('[data-site-navbar] nav a, [data-site-navbar] nav [role="button"]'),
      hamburgers: seen('[aria-label="Open Sidebar"]'),
      // Attribute selector so the Tailwind class's colon needs no escaping
      // through however many layers of quoting this file travels.
      searchBoxes: seen("[data-search-trigger]"),
      chips: seen('[data-site-navbar] a[href="/openhire"] span'),
      nameShown: seen("[data-site-navbar] .truncate"),
      // `scrollWidth` against `clientWidth` catches the row overflowing its own
      // gutter; the height catches it wrapping instead, which is what a flex row
      // does when something inside it is allowed to.
      rowOverflow: row ? row.scrollWidth - row.clientWidth : null,
      rowHeight: row ? Math.round(row.getBoundingClientRect().height) : null,
      edges: (() => {
        // Content box, not border box: the cap is on the same element as the
        // gutter, so where the contents start is the padding edge.
        const inside = (el) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return [
            Math.round(r.left + parseFloat(cs.paddingLeft)),
            Math.round(r.right - parseFloat(cs.paddingRight)),
          ];
        };
        // The page's own content column: the element carrying `max-w-7xl`.
        const column = document.querySelector("#page-content main > div");
        return {
          navbar: inside(row),
          footer: inside(document.querySelector("footer > div")),
          page: column
            ? [
                Math.round(column.getBoundingClientRect().left),
                Math.round(column.getBoundingClientRect().right),
              ]
            : null,
        };
      })(),
    };
  });

  /*
   * The same row, holding chips the profile is not currently asking for.
   *
   * Built from the classes `StatusBadges` writes for the navbar, so it lands in
   * the same breakpoint band as the real thing -- hidden below `2xl`, on the line
   * above it -- and removed again before the next measurement.
   */
  const worstCase = await page.evaluate(() => {
    const row = document.querySelector("[data-navbar-row]");
    if (!row) return null;

    const chip = (label) => {
      const span = document.createElement("span");
      span.className =
        "pill-badge border border-zinc-700 text-zinc-400 transition-colors px-2 py-0.5 text-xs";
      span.textContent = label;
      return span;
    };

    const probe = document.createElement("div");
    probe.className = "hidden shrink-0 items-center gap-1 2xl:flex";
    const pair = document.createElement("a");
    pair.className = "inline-flex shrink-0 gap-1";
    pair.append(chip("Open"), chip("Hiring"));
    probe.append(pair, chip("Unwell"));

    // Where the real one sits: after the identity block, before the nav.
    const nav = row.querySelector("nav");
    row.insertBefore(probe, nav);
    const shape = {
      overflow: row.scrollWidth - row.clientWidth,
      height: Math.round(row.getBoundingClientRect().height),
      shown: probe.getBoundingClientRect().width > 0,
    };
    probe.remove();
    return shape;
  });

  const { navbar: navEdges, footer: footEdges, page: pageEdges } = counts.edges;
  const lines = (a, b) => a !== null && b !== null && Math.abs(a[0] - b[0]) <= 1 && Math.abs(a[1] - b[1]) <= 1;
  const aligned = lines(navEdges, pageEdges) && lines(footEdges, pageEdges);

  const affordances = (counts.hamburgers > 0 ? 1 : 0) + (counts.inlineNav > 0 ? 1 : 0);
  const ok =
    counts.toggles === 1 &&
    counts.navbars === 1 &&
    affordances === 1 &&
    counts.rowOverflow !== null &&
    counts.rowOverflow <= 1 &&
    counts.rowHeight <= ROW_MAX_HEIGHT &&
    worstCase !== null &&
    worstCase.overflow <= 1 &&
    worstCase.height <= ROW_MAX_HEIGHT &&
    aligned;

  if (!ok) failures++;
  console.log(
    `  ${ok ? "ok  " : "FAIL"} ${String(width).padStart(4)}px  ` +
      `toggles=${counts.toggles} nav=${counts.inlineNav} hamburger=${counts.hamburgers} ` +
      `search=${counts.searchBoxes} name=${counts.nameShown} chips=${counts.chips} ` +
      `row=${counts.rowHeight}px overflow=${counts.rowOverflow}px  ` +
      `worst-case=${worstCase ? `${worstCase.height}px/${worstCase.overflow}px` : "not measured"}` +
      `${worstCase?.shown ? " (chips shown)" : ""}  ` +
      `edges=${pageEdges ? pageEdges.join("-") : "?"}${aligned ? "" : ` MISALIGNED nav=${navEdges?.join("-")} footer=${footEdges?.join("-")}`}`,
  );
}

await browser.close();
console.log(
  failures === 0
    ? "\nOne toggle, one way into the nav, and a row that fits, at every width."
    : `\n${failures} width(s) wrong.`,
);
process.exit(failures === 0 ? 0 : 1);
