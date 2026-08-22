/**
 * Compare a detail page's image gallery against the live Django site.
 *
 * The gallery is the one part of these pages that is almost entirely
 * behaviour: a transform track, prev/next buttons, dot indicators, a filename
 * that follows the slide, and -- on projects -- a magnify button that opens
 * the lightbox. compare-layout.mjs measures the frame's box, which is the same
 * whether or not any of that works.
 *
 *   node scripts/compare-gallery.mjs /projects/<slug>/ [nextBase] [liveBase]
 */
import { chromium } from "playwright";

const PATH = process.argv[2] ?? "/projects/belimaducom/";
const NEXT = process.argv[3] ?? "http://localhost:3000";
const LIVE = process.argv[4] ?? "https://ridwaanhall.com";
const WIDTH = Number(process.env.WIDTH ?? 1280);

/** Class lists differ in order between the two renderings; compare as sets. */
function classSet(value) {
  return [...new Set(value.split(/\s+/).filter(Boolean))].sort().join(" ");
}

async function measure(browser, base) {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 1200 } });
  await page.goto(base + PATH, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(1500);

  const read = () =>
    page.evaluate(() => {
      const frame = document.querySelector(".gallery-frame");
      if (!frame) return { missing: true };
      const box = (element) => {
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return `w=${Math.round(rect.width)} h=${Math.round(rect.height)}`;
      };
      return {
        frame: box(frame),
        // Read by position, not by `.current-filename`: the live project
        // page omits that class on its single-image header (the blog page
        // sets it in both branches), and it is only ever a JS hook.
        filename: frame.querySelector(".gallery-header span")?.textContent?.trim() ?? null,
        images: frame.querySelectorAll("img").length,
        // Django leaves the transform unset until the first move; React
        // always states it. `translateX(0%)` and no transform at all are the
        // same rendering, so they are normalised to the same value.
        track:
          frame.querySelector("[class*='-slider-wrapper']")?.style.transform.replace(
            /^(|translateX\(-?0%\))$/,
            "none",
          ) ?? null,
        // `title` is read from data-tooltip when present: the live site's
        // tooltip.js moves the attribute across on first hover, and Playwright
        // hovers before it clicks.
        buttons: [...frame.querySelectorAll("button")].map(
          (button) =>
            `${button.className} @ ${
              button.getAttribute("title") ?? button.getAttribute("data-tooltip")
            } ${box(button)}`,
        ),
        caption: frame.parentElement?.parentElement?.textContent?.includes("Use arrows")
          ? "arrows"
          : null,
      };
    });

  const initial = await read();

  // Advance one slide and read again: this is what proves the track moves, the
  // dots follow and the header filename tracks the slide.
  // Scoped to the gallery: a bare [class*=next] matches elsewhere on the page
  // and silently clicks nothing relevant, which reads as "the filename did not
  // follow the slide" rather than as a broken selector.
  const next = await page.$(".gallery-frame .project-next, .gallery-frame .blog-next");
  if (next) {
    await next.click();
    await page.waitForTimeout(900);
  }
  const advanced = await read();

  // The lightbox, where the page has one. Opened from the magnify button, then
  // advanced once, so the counter, the filename, the dots and the track are all
  // exercised rather than just the opening frame.
  let lightbox = null;
  const magnify = await page.$(".gallery-frame .magnify-button");
  if (magnify) {
    await magnify.click();
    await page.waitForTimeout(700);
    lightbox = await page.evaluate(() => {
      const root = document.querySelector(".image-lightbox");
      if (!root) return { missing: true };
      const box = (element) => {
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return `w=${Math.round(rect.width)} h=${Math.round(rect.height)}`;
      };
      return {
        active: root.classList.contains("active"),
        // Rendered at body level, never inside the transformed page wrapper:
        // a transformed ancestor becomes the containing block for a fixed
        // element, which would position the overlay against the content column.
        atBodyLevel: root.parentElement === document.body,
        bodyOverflow: getComputedStyle(document.body).overflow,
        content: box(root.querySelector(".lightbox-content")),
        stage: box(root.querySelector(".lightbox-image-container")),
        filename: root.querySelector(".lightbox-filename")?.textContent?.trim() ?? null,
        counter: root.querySelector(".lightbox-counter")?.textContent?.trim() ?? null,
        slides: root.querySelectorAll(".lightbox-slide").length,
        dots: root.querySelectorAll(".lightbox-dot").length,
        activeDot: [...root.querySelectorAll(".lightbox-dot")].findIndex((dot) =>
          dot.classList.contains("active"),
        ),
        track: root.querySelector(".lightbox-slider-wrapper")?.style.transform ?? null,
      };
    });

    // A single image has no nav, no counter and no dots -- there is nothing to
    // advance to, so the "after" reading is the same as the first.
    // The live overlay renders its nav unconditionally and hides it with
    // `display: none` for a one-image gallery, so finding the element is not
    // the same as being able to click it.
    const lightboxNext = await page.$(".image-lightbox .lightbox-nav.next");
    if (lightboxNext && (await lightboxNext.isVisible())) {
      await lightboxNext.click();
      await page.waitForTimeout(700);
    }
    const after = await page.evaluate(() => {
      const root = document.querySelector(".image-lightbox");
      return {
        filename: root.querySelector(".lightbox-filename")?.textContent?.trim() ?? null,
        counter: root.querySelector(".lightbox-counter")?.textContent?.trim() ?? null,
        track: root.querySelector(".lightbox-slider-wrapper")?.style.transform ?? null,
        activeDot: [...root.querySelectorAll(".lightbox-dot")].findIndex((dot) =>
          dot.classList.contains("active"),
        ),
      };
    });

    // Escape must close it and give the page its scrolling back.
    await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
    const closed = await page.evaluate(() => ({
      gone: !document.querySelector(".image-lightbox.active"),
      bodyOverflow: getComputedStyle(document.body).overflow,
    }));

    lightbox = { ...lightbox, after, closed };
  }

  await page.close();
  return { initial, advanced, lightbox };
}

const browser = await chromium.launch();
const [live, next] = await Promise.all([measure(browser, LIVE), measure(browser, NEXT)]);
await browser.close();

/**
 * Differences that are expected, with the reason.
 *
 * `advanced.filename` on a project: the live project gallery's header filename
 * never follows the slide, because projectImageSlider.js looks for
 * `.current-filename` inside `.project-slider-container` -- and the header is a
 * *sibling* of that element, inside `.gallery-frame`. The lookup returns null
 * and the update is silently skipped. blogImageSlider.js gets this right by
 * walking up to `.blog-image-gallery` first, which is why the blog gallery does
 * track. The port fixes it; this entry records that the difference is the fix.
 */
/**
 * The lightbox keys below are all one difference: **the live lightbox always
 * opens on the first image**, whichever slide you were looking at.
 * `getCurrentSlideIndex` reads the slider's index back out of its inline
 * `translateX(-200%)` with
 *
 *     /translateX\((-?\d+(?:\.\d+)?)%\)/
 *
 * and in a regex literal `\(` is an escaped backslash followed by the start of
 * a group -- so the pattern looks for a literal backslash after "translateX"
 * and can never match. The function falls through to `return 0` every time.
 * Here the gallery owns the index and hands it over, so the overlay opens on
 * the image the reader was actually on; this run advances the gallery one slide
 * first, which is what surfaces the difference.
 */
const LIGHTBOX_START_INDEX = [
  "lightbox.filename",
  "lightbox.counter",
  "lightbox.activeDot",
  "lightbox.track",
  "lightbox.after.filename",
  "lightbox.after.counter",
  "lightbox.after.activeDot",
  "lightbox.after.track",
];

const EXPECTED = new Set(
  PATH.startsWith("/projects/") ? ["advanced.filename", ...LIGHTBOX_START_INDEX] : [],
);

let problems = 0;
const report = (label, a, b) => {
  if (a === b || EXPECTED.has(label)) return;
  problems++;
  console.log(`${label}\n  live: ${a}\n  next: ${b}`);
};

for (const phase of ["initial", "advanced"]) {
  const a = live[phase];
  const b = next[phase];
  for (const key of ["frame", "filename", "images", "track", "caption"]) {
    report(`${phase}.${key}`, JSON.stringify(a[key]), JSON.stringify(b[key]));
  }
  const count = Math.max(a.buttons.length, b.buttons.length);
  for (let i = 0; i < count; i++) {
    const [x, y] = [a.buttons[i], b.buttons[i]];
    const norm = (value) =>
      value === undefined
        ? "(absent)"
        : value.replace(/^(\S[\s\S]*?) @ /, (_, cls) => `${classSet(cls)} @ `);
    report(`${phase}.button[${i}]`, norm(x), norm(y));
  }
}

if (live.lightbox || next.lightbox) {
  const flat = (value, prefix) =>
    Object.entries(value ?? {}).flatMap(([key, inner]) =>
      inner && typeof inner === "object"
        ? flat(inner, `${prefix}.${key}`)
        : [[`${prefix}.${key}`, JSON.stringify(inner)]],
    );
  const a = new Map(flat(live.lightbox, "lightbox"));
  const b = new Map(flat(next.lightbox, "lightbox"));
  for (const key of new Set([...a.keys(), ...b.keys()])) {
    report(key, a.get(key) ?? "(absent)", b.get(key) ?? "(absent)");
  }
}

console.log(
  problems === 0
    ? `\n${PATH} gallery matches the live site at ${WIDTH}px.`
    : `\n${problems} difference(s) at ${WIDTH}px.`,
);
process.exitCode = problems === 0 ? 0 : 1;
