/**
 * Compare the search palette's per-page state against the live Django site.
 *
 * The palette marks the page you are already on and makes that row inert. It
 * is rendered from data here and was nine hand-written `<li>` blocks there, so
 * the thing worth checking is that both agree on *which* row is current from
 * every page -- including the two that match nested paths.
 *
 *   node scripts/compare-search-palette.mjs [nextBase] [liveBase]
 */
import { chromium } from "playwright";

const NEXT = process.argv[2] ?? "http://localhost:3000";
const LIVE = process.argv[3] ?? "https://ridwaanhall.com";

const PATHS = [
  "/",
  "/dashboard/",
  "/projects/",
  "/projects/belimaducom/",
  "/blog/",
  "/blog/commit-message-style-guide/",
  "/about/",
  "/contact/",
  "/privacy-policy/",
  "/terms/",
];

async function measure(browser, base) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const out = {};

  for (const path of PATHS) {
    await page.goto(base + path, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(900);
    await page.keyboard.press("Control+k");
    await page.waitForTimeout(500);

    out[path] = await page.evaluate(() => {
      const rows = [...document.querySelectorAll("#search-modal .search-item")];
      const marked = rows.filter((row) => row.textContent.includes("You are here"));
      const label = (row) => row.querySelector("span")?.textContent.trim();
      return {
        rows: rows.length,
        here: marked.map(label).join(", ") || "(none)",
        // The marked row must not lead anywhere: the original expressed that
        // as a missing data-url, the port as a missing handler.
        inert: marked.every((row) => !row.getAttribute("data-url")),
        surface: marked
          .map((row) => {
            const inner = row.firstElementChild;
            const style = getComputedStyle(inner);
            return `${style.backgroundColor} cursor=${style.cursor}`;
          })
          .join(" | "),
      };
    });

    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
  }

  await page.close();
  return out;
}

const browser = await chromium.launch();
const [live, next] = await Promise.all([measure(browser, LIVE), measure(browser, NEXT)]);
await browser.close();

/**
 * The current row's cursor is the one deliberate difference. The original left
 * `cursor-pointer` on a row that leads nowhere; the port uses `cursor-default`,
 * matching the sidebar's own current item, which is a `role="button"` with no
 * href.
 */
let problems = 0;
for (const path of PATHS) {
  for (const key of ["rows", "here", "inert"]) {
    const a = JSON.stringify(live[path]?.[key]);
    const b = JSON.stringify(next[path]?.[key]);
    if (a === b) continue;
    problems++;
    console.log(`${path} ${key}\n  live: ${a}\n  next: ${b}`);
  }
  console.log(`  ${path.padEnd(38)} here=${next[path].here}  ${next[path].surface}`);
}

console.log(
  problems === 0
    ? "\nThe palette marks the same row on every page, and it leads nowhere."
    : `\n${problems} difference(s).`,
);
process.exitCode = problems === 0 ? 0 : 1;
