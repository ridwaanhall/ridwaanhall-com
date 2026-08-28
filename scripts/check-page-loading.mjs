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
 *  2. **It reports every navigation, not merely the slow ones.** This is the
 *     half that was got wrong once and is worth stating plainly. The bar used
 *     to wait 120ms before painting, on the reasoning that a flash on an
 *     instant route reads as a glitch. What that collided with is the client
 *     Router Cache: it keeps a prerendered route's payload, so a second visit
 *     to the same route commits in a few milliseconds and the bar painted
 *     nothing at all. First visit reported, second visit silent, from the
 *     reader's side indistinguishable from a bar that is broken. An indicator
 *     that reports only some navigations is worse than one that reports all of
 *     them, so there is no threshold any more -- what removes the flash is
 *     finishing the gesture rather than declining to start it.
 *
 *  3. **The teal survives the light-mode remap.** The site carries no `dark:`
 *     variants -- light mode redefines the palette variables -- so a colour
 *     family with no remap silently stays dark. Teal has one; this measures
 *     that the gradient resolves to something still teal and still visible
 *     against the canvas, in both themes.
 *
 *  4. **A skeleton renders no `<main>`.** The content-entrance fade in
 *     `styles/animations.css` keys on that element precisely because a
 *     skeleton does not have one. A skeleton that grew a `<main>` would fade
 *     itself in and leave the real page to appear with no transition at all.
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

/**
 * Make the next navigation genuinely slow, and keep it that way.
 *
 * Delaying the RSC payload is the obvious half. Refusing prefetches is the half
 * that took a flaky check to find: the rail prefetches every route it links to
 * while the page is settling, so by the time a click arrives the payload is
 * already in the client Router Cache and no request is made at all. The
 * navigation is then instant, there is nothing to wait for, and a check that
 * expects a skeleton fails while reporting nothing about the skeleton.
 *
 * Next marks those requests with a header of their own, which is what makes
 * them separable from the navigation that follows.
 */
const throttle = async (page, ms = 1500) => {
  await page.route("**/*", async (route) => {
    const request = route.request();
    // Held, never refused. A prefetch that is merely slow leaves the router
    // cache empty, which is the state this wants; one that *fails* makes the
    // router fall back to a full document load, and a full load renders the
    // page rather than waiting on it -- so the skeleton being looked for never
    // appears and the check fails for a reason that has nothing to do with it.
    const held = request.headers()["next-router-prefetch"] === "1" ? 30_000 : ms;
    if (request.url().includes("_rsc=")) {
      await new Promise((resolve) => setTimeout(resolve, held));
    }
    await route.continue();
  });
};

/**
 * Two widths, and the difference between them is the whole measurement.
 *
 * `target` is what the bar was *told* to be -- the percentage in its inline
 * style, written the moment a navigation begins. `width` is what it currently
 * measures, which lags behind by however much of the 400ms CSS transition has
 * run.
 *
 * Reveal has to be judged on `target`. Judging it on `width` says the bar
 * appeared when it first became a few pixels wide, and since nothing mutates
 * the element between the start and the first trickle tick, that reads as 200ms
 * of delay that is not there -- the number the transition takes to become
 * visible, reported as though the code had waited. `width` is still the right
 * thing to assert on for how the bar *behaves* once it is up.
 *
 * The parentheses where this is compiled are load-bearing: the source below
 * opens with a newline, and `return` followed by a line break is `return;` --
 * the constructed function hands back `undefined`, every observer callback then
 * throws where nothing is listening, and the frames never arrive at all.
 */
const OBSERVE = `
  (el, frames, clickedAt) => {
    frames.push({
      at: clickedAt === null ? null : performance.now() - clickedAt,
      state: el.dataset.state,
      target: Number.parseFloat(el.style.width) || 0,
      width: el.getBoundingClientRect().width,
    });
  }
`;

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
       hundred milliseconds, and the number being measured below is a couple of
       frames, so the overhead would swamp it entirely.
    */
    const watching = page.evaluate(
      (OBSERVE) =>
        new Promise((resolve) => {
          const el = document.getElementById("page-loading-bar");
          let clickedAt = null;
          /*
            On `window`, and in capture, so this runs before anything else sees the
            click. The bar listens on `document` in capture too, and a microtask
            checkpoint runs between the two -- which flushes the MutationObserver.
            Registered second, this would stamp the time only after the frame it was
            meant to be timing had already been recorded, and every measurement below
            would be of the trickle tick 200ms later instead.
          */
          window.addEventListener("click", () => {
            clickedAt ??= performance.now();
          }, true);

          const frames = [];
          const record = new Function(`return (${OBSERVE})`)();
          const observer = new MutationObserver(() => record(el, frames, clickedAt));
          observer.observe(el, { attributes: true, attributeFilter: ["data-state", "style"] });
          setTimeout(() => {
            observer.disconnect();
            resolve(frames);
          }, 2600);
        }),
      OBSERVE,
    );

    // Two links match at this width -- the rail's and the mobile drawer's,
    // which is off-screen. `:visible` picks the one a reader could click.
    await page.locator('a[href="/dashboard"]:visible').first().click();
    const frames = await watching;
    const shown = frames.filter((f) => f.state === "loading" && f.target > 0);
    const widths = shown.map((f) => Math.round(f.width));

    check("a slow navigation reveals the bar", shown.length > 0, `${shown.length} frame(s)`);

    /*
      And it appears at once. Measuring the first paint is what proves there is
      no threshold hiding in here: a delay reintroduced for any reason shows up
      as a first frame that arrives late, whether or not the navigation it was
      reporting happened to outlast it.
    */
    check("and it appears at once, with nothing held back",
      shown.length > 0 && shown[0].at !== null && shown[0].at < 100,
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

  /* ------------------------------------------------------ cached navigation */
  {
    /*
      The same route, twice. This is the report that rewrote this file: the bar
      appeared on the first visit to a listing and not on the second, which
      looked like a bar that fires at random.

      Nothing was random about it. The first click is a real round trip; by the
      second the route is in the client Router Cache and commits in single-digit
      milliseconds, under whatever threshold the bar was holding. So the check
      that matters is not "a slow navigation is reported" -- the block above
      already proves that -- but that the fastest navigation the site can
      perform is reported too.

      Nothing is throttled here on purpose. A cached navigation is the fast
      case, and the fast case is the one that regressed.
    */
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    // Let the rail's prefetches land, so the second trip is genuinely cached.
    await page.waitForTimeout(1500);

    /*
      Timed from the click, as in the block above, and for a sharper reason
      here: in development every navigation is slow enough to outlast any
      plausible threshold, so "did the bar appear" would pass whether or not a
      delay is present and would prove nothing. When it first appeared is the
      measurement that actually discriminates, and it holds in production too.
    */
    const watch = () =>
      page.evaluate(
        (OBSERVE) =>
          new Promise((resolve) => {
            const el = document.getElementById("page-loading-bar");
            let clickedAt = null;
            // On `window`, in capture, ahead of the bar's own listener -- see above.
            window.addEventListener("click", () => {
              clickedAt ??= performance.now();
            }, true);

            const frames = [];
            const record = new Function(`return (${OBSERVE})`)();
            const observer = new MutationObserver(() => record(el, frames, clickedAt));
            observer.observe(el, { attributes: true, attributeFilter: ["data-state", "style"] });
            setTimeout(() => {
              observer.disconnect();
              resolve(frames);
            }, 1800);
          }),
        OBSERVE,
      );

    const visit = async (href) => {
      const watching = watch();
      await page.locator(`a[href="${href}"]:visible`).first().click();
      await page.waitForURL(`**${href}`, { timeout: 15000 }).catch(() => {});
      return watching;
    };

    const first = await visit("/projects");
    await page.goBack({ waitUntil: "networkidle" });
    /*
      Long enough for the back navigation's own bar to finish. Going back is a
      navigation like any other and is reported like one; observing before it
      has wound down picks up its trailing frames, which carry no click of their
      own and so no timestamp to measure from.
    */
    await page.waitForTimeout(1400);
    const second = await visit("/projects");

    // A frame with no timestamp belongs to a navigation that began before this
    // observation did, and says nothing about the click being measured.
    const revealed = (frames) =>
      frames.filter((f) => f.state === "loading" && f.target > 0 && f.at !== null);

    const firstPaint = (frames) => {
      const shown = revealed(frames);
      return shown.length ? Math.round(shown[0].at) : null;
    };

    check("the first visit to a route is reported",
      revealed(first).length > 0, `${revealed(first).length} frame(s)`);
    check("and so is the second, served from the router cache",
      revealed(second).length > 0, `${revealed(second).length} frame(s)`);
    check("neither is held back behind a threshold",
      firstPaint(first) !== null && firstPaint(first) < 100 &&
        firstPaint(second) !== null && firstPaint(second) < 100,
      `first paint ${firstPaint(first)}ms then ${firstPaint(second)}ms after the click`);

    /*
      What replaced the delay. A bar that is snatched away the instant the route
      commits is the flicker the delay was there to prevent; the fix is to
      finish the gesture instead -- fill to the end, then fade -- so even the
      fastest navigation reads as one deliberate movement rather than a blink.
    */
    // Near enough to the full width, not exactly it: the last frame the
    // observer catches is often one mid-transition, and asserting on a single
    // pixel would make this a check about scheduling rather than about the bar.
    const completed = second.some((f) => f.width >= 1280 * 0.95) &&
      second.some((f) => f.state === "done");
    check("and it finishes its gesture rather than blinking out",
      completed,
      `widths ${[...new Set(second.map((f) => Math.round(f.width)))].join(",")}` +
        ` states ${[...new Set(second.map((f) => f.state))].join(",")}`);

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

    await throttle(page);

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
    /*
      `/about` rather than a listing, and the reason is worth recording because
      it is not obvious. Whether `loading.tsx` renders at all is a property of
      the page, not of the skeleton: the fallback appears only where the segment
      still has work to do once its payload has landed. `/projects` frequently
      resolves in the same tick it arrives, so it shows no skeleton however
      slowly the payload is delivered -- which made this check fail perhaps one
      run in three while reporting, quite wrongly, that the skeleton was
      missing. `/about` has a long cached read behind it and suspends every
      time. `check-skeleton-shape.mjs` covers the rest of them, and treats a
      route that arrives without a skeleton as an observation rather than a
      fault.
    */
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

    /*
      Throttled before the first request, not after it. The rail prefetches
      every route it links to as soon as the page settles, so a throttle
      installed afterwards arrives to find the payload already cached and the
      click it was meant to slow down instant.

      `load` rather than `networkidle` for the same reason: the held prefetches
      keep the connection busy, and idle would never arrive.
    */
    await throttle(page);
    await page.goto(`${BASE}/`, { waitUntil: "load" });
    // Hydration, so the click is a client-side navigation rather than a reload.
    await page.waitForTimeout(2000);

    /*
      Inspected from inside the page, and started before the click.

      A skeleton is on screen for about a tenth of a second -- the payload is
      held, but the router keeps the previous page up until it starts arriving,
      and only then shows the fallback while the rest streams. Waiting for the
      selector from here and then reaching back in to read it is two round trips
      across the driver, and the second one regularly arrived to find the real
      page already in place. That is the whole of this check's history of
      flaking: not a skeleton that failed to render, but one that had come and
      gone between two questions about it.
    */
    const watching = page.evaluate(
      () =>
        new Promise((resolve) => {
          let shape = null;
          const look = () => {
            if (shape) return;
            const node = document.querySelector('[role="status"][aria-busy="true"]');
            if (!node) return;
            shape = {
              announces: (node.textContent ?? "").trim().toLowerCase().startsWith("loading"),
              pulses:
                node.classList.contains("skeleton-pulse") ||
                Boolean(node.closest(".skeleton-pulse")) ||
                Boolean(node.querySelector(".skeleton-pulse")),
              hidesShapes: Boolean(node.querySelector('[aria-hidden="true"]')),
              carriesMain: node.tagName === "MAIN" || Boolean(node.querySelector("main")),
            };
          };
          const poll = setInterval(look, 25);
          setTimeout(() => {
            clearInterval(poll);
            resolve(shape);
          }, 6000);
        }),
    );

    await page.locator('a[href="/about"]:visible').first().click();
    const shape = await watching;

    check("a slow navigation renders a skeleton", shape !== null);

    if (shape) {
      check("it says it is loading rather than reading out its shapes", shape.announces);
      check("its shapes are hidden from assistive technology", shape.hidesShapes);
      check("it pulses", shape.pulses);
      check("it renders no <main>, so the real page's fade still fires", !shape.carriesMain);
    }

    await page.unroute("**/*");
    await page.waitForURL("**/about", { timeout: 15000 }).catch(() => {});
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
