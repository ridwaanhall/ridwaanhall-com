/**
 * Each skeleton is the shape of the page it stands in for.
 *
 * A skeleton is the one piece of UI that is never wrong on its own. It renders,
 * it pulses, it announces itself, it passes every check written about it in
 * isolation -- and it is still wrong if the page that replaces it is a
 * different shape, because the whole job of the thing is to be that shape for a
 * moment. Nothing in `tsc`, `eslint` or the build compares the two, and neither
 * does a person: the skeleton is on screen for a few hundred milliseconds,
 * usually while its author is looking at something else.
 *
 * So this measures them against each other. It walks to a route, catches the
 * skeleton, waits for the real page, and compares.
 *
 * **There are two kinds of skeleton here and both are measured.** The
 * route-level one is `loading.tsx`, shown while the segment resolves. The
 * in-page ones are `<Suspense>` fallbacks around a streaming panel -- the
 * guestbook's thread, the dashboard's two API panels, the listings' results --
 * and they are the ones a reader actually sits and looks at, because they are
 * waiting on a third party rather than on a payload. A page can be perfectly
 * shaped at one level and wrong at the other.
 *
 * What drift actually looks like, all four of which were live when this was
 * written:
 *
 *   - `/projects` held `px-4 py-6` for a page that is `px-3 py-4 sm:px-4`, so
 *     the entire column stepped sideways and up as it landed. One route in ten,
 *     invisible in a screenshot of either state alone.
 *   - The guestbook drew a bordered card with an opaque header bar, which the
 *     panel had stopped having. The skeleton was a picture of the previous
 *     design.
 *   - The dashboard held four cards where the WakaTime panel renders six and
 *     two more panels under them, and four where GitHub renders four and a
 *     contribution heatmap. The page roughly doubled in height on arrival.
 *   - The listing skeleton held the results grid but not the search box above
 *     it, which is inside the same boundary -- so the grid dropped by the
 *     height of a form field the moment the results came back.
 *
 * Three assertions per route, at two widths, and each is measuring something
 * the others cannot see:
 *
 *  1. **The gutter, exactly.** A padding class either matches or it does not,
 *     so the content column's left edge and width are compared to the pixel.
 *
 *     **This has to be measured narrow.** The site's two page gutters are
 *     `px-4 py-6 md:px-6 lg:px-8` and `px-3 py-4 sm:px-4 md:px-6 lg:px-8`, and
 *     from `sm` upwards they resolve to the same number -- so a desktop
 *     viewport reports a perfect match for a route pointed at the wrong one.
 *     The whole disagreement lives below 640px. That is why 375 is here, and
 *     why measuring only at 1280 would have been a check that could not fail.
 *
 *  2. **The padding above the content**, which is the other half of the same
 *     class and the half a width cannot show: `py-6` against `py-4` is eight
 *     pixels of vertical step at every viewport.
 *
 *  3. **The first screen is filled.** Clamped to the viewport rather than
 *     compared outright, because a skeleton is a sketch: holding 886px for a
 *     2347px article is correct -- the reader can only see the first screen of
 *     it, and nothing below the fold can jump before it is scrolled to. What is
 *     not correct is a skeleton that stops halfway up the window and leaves the
 *     rest blank until the page lands. Both numbers are printed, so a failure
 *     reads as a measurement rather than as a verdict.
 *
 * What this deliberately does not catch: a skeleton that is the right size and
 * the wrong furniture. Geometry cannot tell a card from a paragraph, and the
 * listing skeleton that omitted its search row was 56px out of 2400 -- real,
 * worth fixing, and below the resolution of anything measured here.
 *
 * **A route that arrives without a skeleton is reported, not failed.** Whether
 * `loading.tsx` renders at all is a property of the page rather than of the
 * skeleton: the fallback appears only where the segment still has work to do
 * once its payload lands, and `/contact` and `/guestbook` produce their shell
 * immediately, so no window exists at any speed. Failing on that would make
 * this check flake on every page that got faster. Instead the run reports what
 * it could not observe and then asserts on the count, so the guard cannot
 * quietly decay into measuring nothing.
 *
 * Read-only: it opens pages and writes nothing.
 *
 *   npx tsx --conditions=react-server scripts/check-skeleton-shape.mjs [base]
 *
 * Needs the app running (`npm run dev`).
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const { chromium } = await import("playwright");

const BASE = process.argv[2] ?? "http://localhost:3000";

/** A skeleton is a sketch, so its height is compared as a proportion. */
const HEIGHT_TOLERANCE = 0.2;

/*
 * Narrow first, because that is the width the gutters disagree at; wide second,
 * because that is where a skeleton has the most window left to leave empty.
 */
const VIEWPORTS = [
  { label: "375", width: 375, height: 812 },
  { label: "1280", width: 1280, height: 900 },
];

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push(pass);
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

/** Something observed rather than asserted. Not a pass and not a failure. */
const note = (text) => console.log(`  ..    ${text}`);

/** How many route-level skeletons were seen, so the coverage can be asserted. */
let measured = 0;

/*
 * Every route reachable by a click, and where to click from.
 *
 * Reachable is the operative word, and it is a real limit rather than a
 * shortcut: a skeleton is only rendered on a client-side navigation, and a
 * client-side navigation on this site means a `<Link>`. `/terms`,
 * `/privacy-policy` and `/legal/[slug]` are reached from plain anchors and the
 * address bar, so a full document load is the only way in and there is no
 * moment at which their skeleton exists to be measured. They share one
 * component (`LegalSkeleton`), which is at least a single place to look.
 */
const ROUTES = [
  { label: "/", from: "/about", link: 'a[href="/"]' },
  { label: "/about", from: "/", link: 'a[href="/about"]' },
  { label: "/blog", from: "/", link: 'a[href="/blog"]' },
  { label: "/projects", from: "/", link: 'a[href="/projects"]' },
  { label: "/dashboard", from: "/", link: 'a[href="/dashboard"]' },
  { label: "/contact", from: "/", link: 'a[href="/contact"]' },
  { label: "/guestbook", from: "/", link: 'a[href="/guestbook"]' },
  // Reached from the sidebar's account panel, which offers it to a signed-out
  // reader at every width -- in the rail above `md`, in the drawer below it.
  { label: "/sign-in", from: "/", link: 'a[href="/sign-in"]' },
  // The two detail routes, reached from a card on their own listing.
  { label: "/blog/[slug]", from: "/blog", link: 'a[href^="/blog/"]' },
  { label: "/projects/[slug]", from: "/projects", link: 'a[href^="/projects/"]' },
];

/**
 * Make the navigation slow enough to catch, and keep the router cache empty.
 *
 * The same shape as `check-page-loading.mjs`, and for the same reason: the rail
 * prefetches every route it links to while the page settles, and a payload
 * already in the client Router Cache means an instant navigation with no
 * skeleton in it at all. Prefetches are held rather than refused -- a refused
 * one makes the router fall back to a full document load, which renders the
 * page instead of waiting on it.
 */
const throttle = async (page, ms) => {
  await page.route("**/*", async (route) => {
    const request = route.request();
    const held = request.headers()["next-router-prefetch"] === "1" ? 30_000 : ms;
    if (request.url().includes("_rsc=")) {
      await new Promise((resolve) => setTimeout(resolve, held));
    }
    await route.continue();
  });
};

/**
 * Where the route-level skeleton lives, and nowhere else.
 *
 * `#page-content > div` is the content column in `site-shell.tsx`, and its one
 * child is whatever the router is currently showing -- the `loading.tsx`
 * skeleton, or the page. Anchoring here rather than searching the subtree is
 * what separates the two kinds of skeleton this site has.
 *
 * The distinction is easy to miss and produces confident nonsense. Four
 * components render `role="status" aria-busy="true"` from inside a page, as the
 * fallback for a `<Suspense>` around a streaming panel -- the guestbook's, the
 * dashboard's two, the listings'. A plain descendant search matches those as
 * readily as the route-level one, so a measurement taken a moment too late
 * compares a panel against a whole page and reports a wild disagreement about
 * a skeleton that is perfectly correct.
 */
const SKELETON = '#page-content > div > [role="status"][aria-busy="true"]';

/*
 * Not `> div > main`: the blog post wraps its `<main>` in an `<article>`, and
 * a detail route is exactly where a skeleton is most worth measuring. Every
 * page renders one `<main>` and a skeleton renders none, which is the
 * invariant `check-page-loading.mjs` asserts and this one relies on.
 */
const REAL = "#page-content main";

/**
 * The outer box, and the content column inside it.
 *
 * Both states have the same two-element shape -- an element carrying the page
 * gutter, wrapping one that carries `max-w-7xl mx-auto` -- which is what makes
 * them comparable at all. The gutter shows up as the inner element's left edge
 * and width; the outer element's height is the space being held.
 */
const MEASURE = `
  (kind, selectors) => {
    const root = document.querySelector(kind === "skeleton" ? selectors[0] : selectors[1]);
    if (!root) return null;
    const inner = kind === "skeleton"
      ? root.querySelector(':scope > [aria-hidden="true"]')
      : root.querySelector(":scope > div");
    if (!inner) return null;
    const outer = root.getBoundingClientRect();
    const box = inner.getBoundingClientRect();
    return {
      height: Math.round(outer.height),
      left: Math.round(box.left),
      width: Math.round(box.width),
      // The gutter's vertical half. Taken as a distance rather than read off a
      // class so it holds whatever the padding is expressed in.
      padTop: Math.round(box.top - outer.top),
    };
  }
`;

const measure = (page, kind) =>
  page.evaluate(
    ([source, which, selectors]) => new Function(`return (${source})`)()(which, selectors),
    [MEASURE, kind, [SKELETON, REAL]],
  );

/**
 * An in-page `<Suspense>` fallback, and the content that lands in its place.
 *
 * Finding the fallback is easy; finding what replaced it is the part worth
 * explaining. React swaps the boundary's children in situ, so the replacement
 * sits at the same position in the same parent -- recorded here as a path of
 * child indices from `<main>` down. Nothing is written to the page to mark the
 * spot: this has to be able to run against a deployment, and a check that
 * mutates what it is measuring is measuring something else.
 *
 * **One element does not necessarily become one element.** A boundary whose
 * content is a fragment -- which both listings are: a search row, a result
 * count, a grid and a pagination strip -- replaces the single fallback node
 * with several siblings. Measuring only the node at the old index then compares
 * a whole results grid against the search box that happens to have landed
 * first, and reports the skeleton as seventeen times too big. So the sibling
 * count is recorded too, and the replacement is however many nodes the parent
 * grew by.
 */
const INLINE = `
  (mode, state) => {
    const main = document.querySelector("#page-content main");
    if (!main) return null;
    if (mode === "find") {
      const node = main.querySelector('[role="status"][aria-busy="true"]');
      if (!node) return null;
      const path = [];
      for (let el = node; el && el !== main; el = el.parentElement) {
        path.unshift([...el.parentElement.children].indexOf(el));
      }
      const box = node.getBoundingClientRect();
      return {
        path,
        siblings: node.parentElement.children.length,
        height: Math.round(box.height),
        top: Math.round(box.top),
      };
    }
    let parent = main;
    for (const index of state.path.slice(0, -1)) {
      parent = parent.children[index];
      if (!parent) return null;
    }
    const at = state.path[state.path.length - 1];
    const grew = parent.children.length - state.siblings;
    const span = [...parent.children].slice(at, at + grew + 1);
    if (span.length === 0) return null;
    const top = Math.min(...span.map((el) => el.getBoundingClientRect().top));
    const bottom = Math.max(...span.map((el) => el.getBoundingClientRect().bottom));
    return { height: Math.round(bottom - top), top: Math.round(top) };
  }
`;

/**
 * Catch the skeleton from inside the page, rather than reaching in for it.
 *
 * It is on screen for about a tenth of a second. Waiting for the selector and
 * then measuring it is two round trips across the driver, and the second one
 * arrives to find the real page already there -- so the measurement comes back
 * empty and the report says the skeleton never rendered, which is a different
 * and much more alarming claim than the truth.
 *
 * Polling inside the page needs no round trip at all, and 25ms is comfortably
 * inside the window. The first sighting is the one kept: a skeleton is at its
 * full held size the moment it renders, and later samples only catch it being
 * torn down.
 */
const catchInline = (page, ms) =>
  page.evaluate(
    ([source, budget]) =>
      new Promise((resolve) => {
        const take = new Function(`return (${source})`)();
        let caught = null;
        const poll = setInterval(() => {
          caught ??= take("find");
        }, 25);
        setTimeout(() => {
          clearInterval(poll);
          resolve(caught);
        }, budget);
      }),
    [INLINE, ms],
  );

const catchSkeleton = (page, ms) =>
  page.evaluate(
    ([source, selectors, budget]) =>
      new Promise((resolve) => {
        const take = new Function(`return (${source})`)();
        let caught = null;
        const poll = setInterval(() => {
          caught ??= take("skeleton", selectors);
        }, 25);
        setTimeout(() => {
          clearInterval(poll);
          resolve(caught);
        }, budget);
      }),
    [MEASURE, [SKELETON, REAL], ms],
  );

const browser = await chromium.launch();

console.log(`Skeletons against their pages at ${BASE}\n`);

try {
  for (const route of ROUTES) {
   for (const viewport of VIEWPORTS) {
    const where = `${route.label} @${viewport.label}`;
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
    });

    try {
      await throttle(page, 2500);
      // `load`, not `networkidle`: the held prefetches keep the connection busy
      // and idle would never arrive.
      await page.goto(`${BASE}${route.from}`, { waitUntil: "load" });
      // Hydration, so the click is a client-side navigation and not a reload.
      await page.waitForTimeout(2500);

      /*
        Below `md` the rail is gone and its links live in the drawer, which is
        closed -- so a nav link has to be uncovered before it can be clicked.
        Only then, though: the two detail routes are reached from a card in the
        page itself, and opening the drawer over one is how that click came to
        time out rather than navigate.
      */
      let target = page.locator(`${route.link}:visible`).first();
      if (viewport.width < 768 && !(await target.isVisible().catch(() => false))) {
        await page.locator('button[aria-label="Open Sidebar"]').click();
        await page.waitForTimeout(500);
        target = page.locator(`${route.link}:visible`).first();
      }

      // Watching starts before the click, so nothing can happen unobserved.
      const watching = catchSkeleton(page, 9000);
      const watchingInline = catchInline(page, 9000);
      await target.click();
      const skeleton = await watching;
      const inline = { fallback: await watchingInline, landed: null };

      const landed = new URL(page.url()).pathname;
      if (landed === route.from) {
        check(`${where}: the link navigates`, false, `never left ${landed}`);
        continue;
      }

      /*
        Now let it finish. The page is not settled when its `<main>` appears --
        the listings, the dashboard and the guestbook all stream a second time
        behind their own boundaries, and measuring between the two would compare
        the skeleton against a page that is still partly missing.
      */
      await page.waitForSelector(REAL, { timeout: 20_000 });
      await page
        .waitForFunction(
          () => !document.querySelector('#page-content [role="status"][aria-busy="true"]'),
          { timeout: 20_000 },
        )
        .catch(() => {});
      await page.waitForTimeout(600);

      if (inline.fallback) {
        inline.landed = await page.evaluate(
          ([source, mode, state]) => new Function(`return (${source})`)()(mode, state),
          [INLINE, "landed", inline.fallback],
        );
      }

      const real = await measure(page, "real");
      if (!real) {
        check(`${where}: the page could be measured`, false, "no <main> arrived");
        continue;
      }

      /*
        Clamped to the window. Below the fold nothing can jump before it is
        scrolled to, so a skeleton owes the reader the first screen and no more.
      */
      const seen = (h) => Math.min(h, viewport.height);
      const apart = (a, b) => Math.abs(seen(a) - seen(b)) / Math.max(seen(b), 1);

      if (skeleton) {
        measured++;
        check(`${where}: the same gutter as its page`,
          skeleton.left === real.left &&
            skeleton.width === real.width &&
            skeleton.padTop === real.padTop,
          `skeleton ${skeleton.left}+${skeleton.width} top ${skeleton.padTop}, ` +
            `page ${real.left}+${real.width} top ${real.padTop}`);

        const off = apart(skeleton.height, real.height);
        check(`${where}: and it fills as much of the first screen`,
          off <= HEIGHT_TOLERANCE,
          `held ${skeleton.height}px for a ${real.height}px page, ` +
            `${Math.round(off * 100)}% of the window apart`);
      } else {
        note(`${where}: arrived with no route skeleton -- nothing for one to cover`);
      }

      if (inline.fallback && inline.landed) {
        const off = apart(inline.fallback.height, inline.landed.height);
        check(`${where}: its streaming panel holds the space it needs`,
          off <= HEIGHT_TOLERANCE,
          `held ${inline.fallback.height}px for ${inline.landed.height}px, ` +
            `${Math.round(off * 100)}% of the window apart`);
      }
    } catch (error) {
      check(`${where}: measured`, false, error.message.split("\n")[0]);
    } finally {
      await page.close();
    }
   }
  }
} finally {
  await browser.close();
}

/*
 * The floor. Individual routes come and go -- a page gets faster, a fallback
 * stops being reached -- and none of that should fail a run on its own. What
 * would be a real failure is all of them going quiet at once, leaving a check
 * that passes because it measured nothing.
 */
const FLOOR = 8;
check(`enough skeletons were actually observed to be worth asserting on`,
  measured >= FLOOR, `${measured} of ${ROUTES.length * VIEWPORTS.length}, floor ${FLOOR}`);

const failed = checks.filter((ok) => !ok).length;
console.log(
  failed === 0
    ? `\nEvery skeleton is the shape of its page, across ${checks.length} checks.`
    : `\n${failed} of ${checks.length} checks failed.`,
);
process.exit(failed === 0 ? 0 : 1);
