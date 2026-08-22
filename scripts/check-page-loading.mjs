/**
 * The navigation progress bar and the per-route skeletons.
 *
 * Neither is visible to `tsc`, `eslint` or the build, and both fail silently: a
 * bar positioned against the content column instead of the viewport still
 * renders, and a skeleton that never appears looks exactly like a fast page.
 *
 * The things worth proving are the ones with a way of going wrong:
 *
 *  1. **The bar is outside `#page-content`.** That element animates a
 *     transform, and a transformed ancestor becomes the containing block for
 *     its `position: fixed` descendants -- the same trap the toast stack, the
 *     tooltips, the spark canvas and the confirm dialog are all placed to
 *     avoid. `check-notifications.mjs` asserts it for the toasts; this is the
 *     same assertion for the bar, plus the measurement that catches it: pinned
 *     to the viewport, the bar starts at the viewport's own corner.
 *
 *  2. **It reports a slow navigation and stays out of a fast one.** Both halves
 *     matter. A bar that never shows is useless; a bar that flashes on a
 *     prefetched route is worse than none, and every public route here is
 *     prerendered and prefetched.
 *
 *  3. **The teal survives the light-mode remap.** The site carries no `dark:`
 *     variants -- light mode redefines the palette variables -- so a colour
 *     family with no remap silently stays dark. Teal has one; this measures
 *     that the gradient resolves to something still teal and still visible
 *     against the canvas, in both themes.
 *
 *  4. **A skeleton renders no `<main>`.** The content-entrance fade in
 *     globals.css keys on that element precisely because a skeleton does not
 *     have one. A skeleton that grew a `<main>` would fade itself in and leave
 *     the real page to appear with no transition at all.
 *
 * Read-only: it opens pages and writes nothing.
 *
 *   npx tsx --conditions=react-server scripts/check-page-loading.mjs [base]
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const { chromium } = await import("playwright");

const BASE = process.argv[2] ?? "http://localhost:3000";

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push(pass);
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

/**
 * Resolve any CSS colour to an [r,g,b] triple, in the page.
 *
 * `getComputedStyle` hands back whatever space the value was authored in --
 * Tailwind v4's palette is `oklch`, and a gradient's stops come back as
 * `lab(...)`. Rather than implement three colour spaces here, paint each one
 * onto a canvas and read the pixel: the browser already knows how.
 */
const TO_RGB = (colors) => {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  return colors.map((color) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b];
  });
};

function luminance([r, g, b]) {
  const channel = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const browser = await chromium.launch();

try {
  /* ------------------------------------------------------------- placement */
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });

    const bar = await page.evaluate(() => {
      const el = document.getElementById("page-loading-bar");
      if (!el) return null;
      const content = document.getElementById("page-content");
      const box = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        insideContent: Boolean(content && content.contains(el)),
        state: el.dataset.state,
        position: style.position,
        zIndex: style.zIndex,
        opacity: Number(style.opacity),
        left: box.left,
        top: box.top,
      };
    });

    check("the bar is in the document", bar !== null);
    check("outside #page-content, so it is pinned to the viewport", bar?.insideContent === false);
    check("and it measures from the viewport's own corner", bar?.left === 0 && bar?.top === 0,
      `left=${bar?.left} top=${bar?.top}`);
    check("fixed, above the mobile header and the toast stack",
      bar?.position === "fixed" && Number(bar?.zIndex) > 60,
      `${bar?.position} z=${bar?.zIndex}`);
    check("idle and invisible on arrival", bar?.state === "idle" && bar?.opacity === 0,
      `state=${bar?.state} opacity=${bar?.opacity}`);

    await page.close();
  }

  /* -------------------------------------------------------- slow navigation */
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });

    /*
      Hold the payload the click asks for. Prefetches have already landed, so
      this delays the navigation itself rather than the page around it.
    */
    await page.route("**/*", async (route) => {
      const url = route.request().url();
      if (route.request().isNavigationRequest() || url.includes("_rsc=")) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
      await route.continue();
    });

    /*
       Timestamps are taken in the page and measured from the click itself, not
       from when observing began -- dispatching a Playwright click costs a few
       hundred milliseconds, which would swamp the 120ms being measured.
    */
    const watching = page.evaluate(
      () =>
        new Promise((resolve) => {
          const el = document.getElementById("page-loading-bar");
          let clickedAt = null;
          document.addEventListener("click", () => {
            clickedAt ??= performance.now();
          }, true);

          const frames = [];
          const observer = new MutationObserver(() => {
            frames.push({
              at: clickedAt === null ? null : performance.now() - clickedAt,
              state: el.dataset.state,
              width: el.getBoundingClientRect().width,
            });
          });
          observer.observe(el, { attributes: true, attributeFilter: ["data-state", "style"] });
          setTimeout(() => {
            observer.disconnect();
            resolve(frames);
          }, 2600);
        }),
    );

    // Two links match at this width -- the rail's and the mobile drawer's,
    // which is off-screen. `:visible` picks the one a reader could click.
    await page.locator('a[href="/dashboard"]:visible').first().click();
    const frames = await watching;
    const shown = frames.filter((f) => f.state === "loading" && f.width > 0);
    const widths = shown.map((f) => Math.round(f.width));

    check("a slow navigation reveals the bar", shown.length > 0, `${shown.length} frame(s)`);

    /*
      The delay is what keeps an instant navigation from flashing, and it is the
      half of the contract a fast route cannot prove -- a route that is quick
      today may not be tomorrow, and the check would quietly stop testing
      anything. Measuring when the bar first appears proves it directly: reveal
      earlier than the delay and the guard is gone.
    */
    check("and not before the reveal delay has passed",
      shown.length > 0 && shown[0].at !== null && shown[0].at >= 100,
      shown.length && shown[0].at !== null
        ? `first paint ${Math.round(shown[0].at)}ms after the click`
        : "never revealed");
    check("and it advances rather than sitting at one width", new Set(widths).size > 1,
      widths.slice(0, 6).join(" -> "));
    check("it never claims to be finished before it is",
      shown.every((f) => f.width < 1280),
      `max ${Math.max(0, ...widths)} of 1280`);

    await page.unroute("**/*");
    await page.close();
  }

  /* -------------------------------------------------------- fast navigation */
  {
    /*
      The rule is not "a prefetched route never shows a bar" -- under partial
      prerendering every page here has a dynamic hole, so some genuinely do
      wait, and `/about` and `/guestbook` measurably take 200-400ms. The rule is
      the one the reveal delay exists to enforce: a navigation that finishes
      faster than the delay must never paint anything at all.

      So this measures the wait and the bar together, and asserts they agree.
      A regression that drops the delay fails here; one that merely makes a page
      slower does not, which is what keeps this from flaking.
    */
    const REVEAL_DELAY_MS = 120;

    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const watching = page.evaluate(
      () =>
        new Promise((resolve) => {
          const el = document.getElementById("page-loading-bar");
          const started = performance.now();
          const seen = [];
          const observer = new MutationObserver(() => {
            seen.push({ at: performance.now() - started, state: el.dataset.state });
          });
          observer.observe(el, { attributes: true, attributeFilter: ["data-state"] });
          setTimeout(() => {
            observer.disconnect();
            resolve(seen);
          }, 2000);
        }),
    );

    const clickedAt = Date.now();
    await page.locator('a[href="/contact"]:visible').first().click();
    await page.waitForURL("**/contact", { timeout: 15000 }).catch(() => {});
    const waited = Date.now() - clickedAt;
    const revealed = (await watching).some((f) => f.state === "loading");

    check("a navigation shorter than the reveal delay paints nothing",
      waited >= REVEAL_DELAY_MS || !revealed,
      `waited ${waited}ms, ${revealed ? "revealed" : "stayed hidden"}`);
    check("and one that outlasts it is reported",
      waited < REVEAL_DELAY_MS * 3 || revealed,
      `waited ${waited}ms, ${revealed ? "revealed" : "stayed hidden"}`);

    await page.close();
  }

  /* ------------------------------------------------------------ both themes */
  for (const theme of ["dark", "light"]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });

    const measured = await page.evaluate((toRgb) => {
      const convert = new Function(`return ${toRgb}`)();
      const el = document.getElementById("page-loading-bar");
      const image = getComputedStyle(el).backgroundImage;
      // Any function-form colour: the stops arrive as lab(), the canvas as rgb().
      const found = image.match(/(?:lab|lch|oklab|oklch|rgba?|hsla?|color)\([^)]*\)/g) ?? [];
      return {
        stops: convert(found),
        canvas: convert([getComputedStyle(document.body).backgroundColor])[0],
        theme: document.documentElement.dataset.theme,
      };
    }, TO_RGB.toString());

    check(`${theme}: the page is in that theme`, measured.theme === theme, measured.theme);

    const stops = measured.stops;
    const canvas = measured.canvas;

    check(`${theme}: the gradient resolves to real colours`, stops.length >= 3,
      `${stops.length} stop(s)`);
    check(`${theme}: every stop is still teal, not grey`,
      stops.length > 0 && stops.every(([r, g, b]) => g > r && b > r),
      stops.map((s) => s.join(",")).join(" | "));

    const worst = stops.length && canvas ? Math.min(...stops.map((s) => contrast(s, canvas))) : 0;
    check(`${theme}: it is visible against the canvas`, worst >= 1.6, `contrast ${worst.toFixed(2)}:1`);

    await page.close();
  }

  /* ----------------------------------------------------------- reduced motion */
  {
    /*
      Every animation on this site has a `prefers-reduced-motion` counterpart,
      and these are no exception -- with one deliberate asymmetry. The skeleton
      stops pulsing, because a pulse is decoration. The bar keeps appearing,
      because it reports whether the site is working; what it drops is the
      easing and the creep, leaving a bar that holds still until the page lands.
    */
    const page = await browser.newPage({
      viewport: { width: 1280, height: 900 },
      reducedMotion: "reduce",
    });
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });

    const still = await page.evaluate(() => {
      const bar = document.getElementById("page-loading-bar");
      return getComputedStyle(bar).transitionDuration;
    });
    check("the bar drops its easing under reduced motion",
      /^(0s)(,\s*0s)*$/.test(still.trim()), still);

    await page.route("**/*", async (route) => {
      if (route.request().url().includes("_rsc=")) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      await route.continue();
    });

    const watching = page.evaluate(
      () =>
        new Promise((resolve) => {
          const el = document.getElementById("page-loading-bar");
          const widths = [];
          const observer = new MutationObserver(() => {
            if (el.dataset.state === "loading") widths.push(Math.round(el.getBoundingClientRect().width));
          });
          observer.observe(el, { attributes: true, attributeFilter: ["data-state", "style"] });
          setTimeout(() => {
            observer.disconnect();
            resolve(widths);
          }, 1800);
        }),
    );

    await page.locator('a[href="/guestbook"]:visible').first().click();
    const widths = await watching;
    check("but still says the site is working", widths.length > 0 && widths.some((w) => w > 0),
      widths.join(",") || "never appeared");
    check("and it holds still instead of creeping", new Set(widths).size <= 1,
      widths.length ? `${new Set(widths).size} distinct width(s)` : "n/a");

    const pulsing = await page
      .locator('[role="status"][aria-busy="true"]')
      .first()
      .waitFor({ state: "attached", timeout: 4000 })
      .then(() =>
        page.evaluate(() => {
          const node = document.querySelector(".skeleton-pulse");
          return node ? getComputedStyle(node).animationName : "none";
        }),
      )
      .catch(() => "none");
    check("the skeleton stops pulsing", pulsing === "none", pulsing);

    await page.unroute("**/*");
    await page.close();
  }

  /* ---------------------------------------------------------------- skeleton */
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });

    await page.route("**/*", async (route) => {
      if (route.request().url().includes("_rsc=")) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      await route.continue();
    });

    await page.locator('a[href="/projects"]:visible').first().click();

    const appeared = await page
      .locator('[role="status"][aria-busy="true"]')
      .first()
      .waitFor({ state: "attached", timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    check("a slow navigation renders a skeleton", appeared);

    if (appeared) {
      const shape = await page.evaluate(() => {
        const node = document.querySelector('[role="status"][aria-busy="true"]');
        return {
          announces: (node.textContent ?? "").trim().toLowerCase().startsWith("loading"),
          pulses:
            node.classList.contains("skeleton-pulse") ||
            Boolean(node.closest(".skeleton-pulse")) ||
            Boolean(node.querySelector(".skeleton-pulse")),
          hidesShapes: Boolean(node.querySelector('[aria-hidden="true"]')),
          carriesMain: node.tagName === "MAIN" || Boolean(node.querySelector("main")),
        };
      });

      check("it says it is loading rather than reading out its shapes", shape.announces);
      check("its shapes are hidden from assistive technology", shape.hidesShapes);
      check("it pulses", shape.pulses);
      check("it renders no <main>, so the real page's fade still fires", !shape.carriesMain);
    }

    await page.unroute("**/*");
    await page.waitForURL("**/projects", { timeout: 15000 }).catch(() => {});
    await page.waitForSelector("main", { timeout: 15000 }).catch(() => {});
    const mains = await page.locator("main").count();
    check("and the real page arrives with its <main>", mains === 1, `${mains} main element(s)`);

    await page.close();
  }
} finally {
  await browser.close();
}

const failed = checks.filter((ok) => !ok).length;
console.log(
  failed === 0
    ? `\nThe loading bar and the skeletons behave, across ${checks.length} checks.`
    : `\n${failed} of ${checks.length} checks failed.`,
);
process.exit(failed === 0 ? 0 : 1);
