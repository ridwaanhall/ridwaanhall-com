/**
 * Compare /openhire/ against the live Django site -- both tabs.
 *
 * compare-layout.mjs measures the headings and the overall height of whatever
 * is on screen, which on this page is only the "Open to Work" panel: the
 * hiring panel is `hidden` until its tab is clicked, so every box it would
 * measure is zero on both sides and matches trivially. This script clicks
 * through to it, expands every position, and checks two things the geometry
 * pass cannot:
 *
 *  - the rendered *text* of each panel, line for line, and
 *  - the geometry of the hiring panel once it is actually visible.
 *
 *   node scripts/compare-openhire.mjs [nextBase] [liveBase]     (WIDTH=1280)
 */
import { chromium } from "playwright";

const NEXT = process.argv[2] ?? "http://localhost:3000";
const LIVE = process.argv[3] ?? "https://ridwaanhall.com";
const WIDTH = Number(process.env.WIDTH ?? 1280);

async function measure(browser, base) {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 1200 } });
  await page.goto(`${base}/openhire/`, { waitUntil: "load", timeout: 60000 });
  // Let the tab entrance transition settle so nothing is read mid-transform.
  await page.waitForTimeout(1200);

  const readVisiblePanel = () =>
    page.evaluate(() => {
      const panel =
        [...document.querySelectorAll(".tab-content > div, main > div > div.w-full")].find(
          (element) => element.offsetParent !== null,
        ) ?? document.querySelector("main");
      return panel.innerText
        .replace(/[ \t]+/g, " ")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    });

  const opentowork = await readVisiblePanel();

  await page.click("#tab-hiring");
  await page.waitForTimeout(900);

  // Every position's detail panel, so the skills, responsibilities, benefits
  // and apply link are all in the comparison.
  for (const toggle of await page.$$("button:has-text('Show Details')")) {
    await toggle.click();
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(500);

  const hiring = await readVisiblePanel();
  const boxes = await page.evaluate(() => {
    const label = (element) => element.textContent.replace(/\s+/g, " ").trim();
    const panel = document.querySelector("#content-hiring");
    const origin = panel.getBoundingClientRect();
    // Measured *relative to the panel*. Clicking each Show Details button
    // scrolls the page, and the two sides do not end up at the same offset --
    // an absolute y would report a constant shift as eleven differences.
    const box = (element) => {
      const rect = element.getBoundingClientRect();
      return `x=${Math.round(rect.x - origin.x)} y=${Math.round(rect.y - origin.y)} w=${Math.round(rect.width)} h=${Math.round(rect.height)}`;
    };
    const out = { panel: `w=${Math.round(origin.width)} h=${Math.round(origin.height)}` };
    panel.querySelectorAll("h2, h3").forEach((heading, index) => {
      out[`${heading.tagName.toLowerCase()}[${index}] ${label(heading)}`] = box(heading);
    });
    return out;
  });

  await page.close();
  return { opentowork, hiring, boxes };
}

const browser = await chromium.launch();
const [live, next] = await Promise.all([measure(browser, LIVE), measure(browser, NEXT)]);
await browser.close();

let problems = 0;

for (const panel of ["opentowork", "hiring"]) {
  const a = live[panel];
  const b = next[panel];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] === b[i]) continue;
    problems++;
    console.log(`text ${panel}[${i}]\n  live: ${JSON.stringify(a[i])}\n  next: ${JSON.stringify(b[i])}`);
  }
}

/**
 * The same +/-2px tolerance compare-layout.mjs uses, and for the same reason:
 * sub-pixel layout and font hinting differ harmlessly between two renderings
 * of identical markup, and one fractional pixel inside an expanded position
 * would otherwise report every heading below it as a difference.
 */
const TOLERANCE = 2;

function within(a, b) {
  if (a === b) return true;
  if (a === undefined || b === undefined) return false;
  const numbers = (value) => [...value.matchAll(/-?\d+/g)].map((match) => Number(match[0]));
  const [x, y] = [numbers(a), numbers(b)];
  return x.length === y.length && x.every((value, i) => Math.abs(value - y[i]) <= TOLERANCE);
}

for (const key of new Set([...Object.keys(live.boxes), ...Object.keys(next.boxes)])) {
  if (within(live.boxes[key], next.boxes[key])) continue;
  problems++;
  console.log(`box ${key}\n  live: ${live.boxes[key]}\n  next: ${next.boxes[key]}`);
}

console.log(
  problems === 0
    ? `\n/openhire/ matches the live site at ${WIDTH}px -- both tabs, text and geometry.`
    : `\n${problems} differences at ${WIDTH}px.`,
);
process.exitCode = problems === 0 ? 0 : 1;
