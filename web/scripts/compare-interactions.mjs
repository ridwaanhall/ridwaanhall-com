/**
 * Compare the three document-wide client behaviours against the live site.
 *
 * These are the parts of the port with no markup of their own -- a tooltip
 * chip, a canvas overlay and a disabled button -- so nothing in a layout or
 * text comparison sees them at all.
 *
 *   node scripts/compare-interactions.mjs [nextBase] [liveBase]
 */
import { chromium } from "playwright";

const NEXT = process.argv[2] ?? "http://localhost:3000";
const LIVE = process.argv[3] ?? "https://ridwaanhall.com";
const WIDTH = Number(process.env.WIDTH ?? 1280);

/**
 * The touch pass, which is the whole reason tooltip.js exists: a native
 * `title` renders on hover only, so on a phone every one of them is
 * unreachable. Emulated as a real touch device -- Playwright's `tap` sends a
 * touch sequence, so the `pointerdown` that records `pointerType` is genuine.
 */
async function measureTouch(browser, base) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto(`${base}/dashboard/`, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(1500);

  let target = null;
  for (const candidate of await page.$$("main [title]")) {
    if (await candidate.isVisible()) {
      target = candidate;
      break;
    }
  }
  if (!target) {
    await context.close();
    return { trigger: false };
  }

  const label = (await target.getAttribute("title"))?.trim();
  await target.tap();
  await page.waitForTimeout(400);
  const shown = await page.evaluate(
    (text) => {
      const chip = document.querySelector(".app-tooltip");
      return {
        visible: chip?.getAttribute("data-visible") ?? null,
        matches: chip?.textContent.trim() === text,
      };
    },
    label,
  );

  // It must time itself out rather than sit there until the next tap.
  await page.waitForTimeout(2400);
  const later = await page.evaluate(
    () => document.querySelector(".app-tooltip")?.getAttribute("data-visible") ?? null,
  );

  await context.close();
  return { trigger: true, ...shown, afterTimeout: later };
}

async function measure(browser, base) {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 900 } });
  const out = {};

  // --- searchEnable: the submit button is disabled until the field has text.
  await page.goto(`${base}/blog/`, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(1200);
  /**
   * Colours are normalised to hex before comparing.
   *
   * `getComputedStyle` serialises a wide-gamut colour in whatever space it was
   * resolved in -- the live stylesheet's `oklch()` comes back as `oklch()`,
   * while the same colour reached through the port's variable chain comes back
   * as `lab()`. Both paint the identical pixel; only the text differs. Round
   * both through a canvas `fillStyle`, which always answers in hex.
   */
  const buttonState = () =>
    page.evaluate(() => {
      const ctx = document.createElement("canvas").getContext("2d", {
        willReadFrequently: true,
      });
      // Paint the colour and read the pixel back: assigning to `fillStyle`
      // alone echoes a wide-gamut colour in whatever notation it arrived in,
      // which is the thing being normalised away.
      const hex = (value) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = value;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`;
      };
      const button = document.querySelector("#searchButton");
      const style = getComputedStyle(button);
      return {
        disabled: button.disabled,
        opacity: Number(style.opacity).toFixed(2),
        cursor: style.cursor,
        borderColor: hex(style.borderColor),
        background: hex(style.backgroundColor),
      };
    });
  out.searchEmpty = await buttonState();
  await page.fill("#searchInput", "django");
  // Past the 300ms colour/opacity transition, or the reading is taken
  // mid-interpolation and lands on an arbitrary intermediate value.
  await page.waitForTimeout(600);
  out.searchFilled = await buttonState();
  // Whitespace alone must not enable it.
  await page.fill("#searchInput", "   ");
  await page.waitForTimeout(600);
  out.searchBlank = await buttonState();

  // --- tooltip: a `title` is migrated to data-tooltip and a chip is placed.
  await page.goto(`${base}/dashboard/`, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(1500);
  // The first `[title]` in the document is inside the mobile navbar, which is
  // display:none at this width -- pick the first one actually on screen.
  let target = null;
  for (const candidate of await page.$$("main [title]")) {
    if (await candidate.isVisible()) {
      target = candidate;
      break;
    }
  }
  out.tooltipTriggerFound = Boolean(target);
  if (target) {
    const before = await target.getAttribute("title");
    await target.hover();
    await page.waitForTimeout(500);
    out.tooltip = await page.evaluate((text) => {
      const ctx = document.createElement("canvas").getContext("2d", {
        willReadFrequently: true,
      });
      // Paint the colour and read the pixel back: assigning to `fillStyle`
      // alone echoes a wide-gamut colour in whatever notation it arrived in,
      // which is the thing being normalised away.
      const hex = (value) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = value;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`;
      };
      const chip = document.querySelector(".app-tooltip");
      if (!chip) return { chip: false };
      const style = getComputedStyle(chip);
      return {
        chip: true,
        atBodyLevel: chip.parentElement === document.body,
        visible: chip.getAttribute("data-visible"),
        placement: chip.getAttribute("data-placement"),
        matchesTitle: chip.textContent.trim() === text.trim(),
        position: style.position,
        opacity: style.opacity,
        background: hex(style.backgroundColor),
        color: hex(style.color),
        fontSize: style.fontSize,
      };
    }, before);
    // The attribute must have moved, so the browser stops drawing its own.
    out.titleRemoved = (await target.getAttribute("title")) === null;
    out.dataTooltipSet = (await target.getAttribute("data-tooltip")) === before.trim();
  }

  // --- click spark: one canvas, appended to body, sized to the viewport.
  await page.mouse.click(WIDTH / 2, 450);
  await page.waitForTimeout(120);
  out.spark = await page.evaluate(() => {
    const canvas = document.querySelector(".click-spark-canvas");
    if (!canvas) return { canvas: false };
    const style = getComputedStyle(canvas);
    return {
      canvas: true,
      atBodyLevel: canvas.parentElement === document.body,
      count: document.querySelectorAll(".click-spark-canvas").length,
      cssWidth: canvas.style.width,
      cssHeight: canvas.style.height,
      position: style.position,
      pointerEvents: style.pointerEvents,
      zIndex: style.zIndex,
      // Something was actually painted.
      painted: (() => {
        const ctx = canvas.getContext("2d");
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) return true;
        return false;
      })(),
    };
  });

  await page.close();
  return out;
}

const browser = await chromium.launch();
const [live, next, liveTouch, nextTouch] = await Promise.all([
  measure(browser, LIVE),
  measure(browser, NEXT),
  measureTouch(browser, LIVE),
  measureTouch(browser, NEXT),
]);
await browser.close();
live.touch = liveTouch;
next.touch = nextTouch;

let problems = 0;
const flat = (value, prefix) =>
  value && typeof value === "object"
    ? Object.entries(value).flatMap(([key, inner]) => flat(inner, `${prefix}.${key}`))
    : [[prefix, JSON.stringify(value)]];

const a = new Map(Object.entries(live).flatMap(([key, value]) => flat(value, key)));
const b = new Map(Object.entries(next).flatMap(([key, value]) => flat(value, key)));

/**
 * Colours are allowed to differ by one step per channel.
 *
 * The two builds serialise the same palette differently: Django's Tailwind CLI
 * emits `oklch(37% .013 285.805)`, while the Next pipeline's Lightning CSS pass
 * emits a `#3f3f46` fallback followed by `lab(26.8019% 1.35386 -4.68303)` -- a
 * browser-target artefact, not a design change. Converting through those spaces
 * lands one unit apart in a single channel on some colours (zinc-700 is
 * 63,63,71 one way and 63,63,70 the other, and the hex is Tailwind's own
 * canonical value for it). Anything larger than a step is a real difference.
 */
function sameColour(x, y) {
  const parse = (value) => value.match(/[\d.]+/g)?.map(Number);
  const [p, q] = [parse(x), parse(y)];
  if (!p || !q || p.length !== q.length) return false;
  return p.every((value, i) => Math.abs(value - q[i]) <= 1);
}

for (const key of new Set([...a.keys(), ...b.keys()])) {
  const [x, y] = [a.get(key) ?? "(absent)", b.get(key) ?? "(absent)"];
  if (x === y) continue;
  if (x.includes("rgba(") && y.includes("rgba(") && sameColour(x, y)) continue;
  problems++;
  console.log(`${key}\n  live: ${x}\n  next: ${y}`);
}

// Printed rather than merely compared: "both sides found no tooltip trigger"
// would otherwise pass silently, and the touch path is the whole point.
console.log(
  `\ntouch: chip ${next.touch.visible === "true" ? "shown" : "NOT shown"} on tap` +
    `, text ${next.touch.matches ? "matches" : "DOES NOT match"} the title` +
    `, ${next.touch.afterTimeout === "true" ? "STILL up" : "dismissed"} after 2.4s`,
);

console.log(
  problems === 0
    ? `\nTooltips, click spark and search-enable all match the live site at ${WIDTH}px.`
    : `\n${problems} difference(s) at ${WIDTH}px.`,
);
process.exitCode = problems === 0 ? 0 : 1;
