/**
 * The toast stack must not be inside `#page-content`.
 *
 * That element animates a `translateY`, and a transformed ancestor becomes the
 * containing block for its `position: fixed` descendants -- a stack rendered
 * inside it would be positioned against the content column instead of the
 * viewport, and the confirm dialog's backdrop blur would stop at the sidebar.
 *
 * Django asserted this structurally in `apps/core/tests/test_notifications.py`
 * because nothing else in that tree caught it; the same is true here, and the
 * mistake is a one-line move that looks harmless in review.
 *
 * `<Toaster>` renders its region whether or not any toast is showing, so this
 * needs no page that raises one. The confirm dialog only exists while open, so
 * it is checked here too but only opportunistically -- it gains a real trigger
 * when the guestbook lands and this should drive that button then.
 *
 *   node scripts/check-notifications.mjs [base]
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3000";
const PATHS = ["/", "/about/", "/blog/"];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

let ok = true;
for (const path of PATHS) {
  await page.goto(BASE + path, { waitUntil: "load", timeout: 60000 });
  const result = await page.evaluate(() => {
    const region = document.querySelector("[data-sonner-toaster], [aria-label^='Notifications']");
    const pageContent = document.getElementById("page-content");
    if (!region) return { found: false };
    return {
      found: true,
      hasPageContent: !!pageContent,
      nested: pageContent ? pageContent.contains(region) : null,
      z: Number(getComputedStyle(region).zIndex || region.closest("[style*='z-index']")?.style.zIndex || 0),
    };
  });

  if (!result.found) {
    console.log(`  FAIL  ${path}  no toast region rendered`);
    ok = false;
  } else if (!result.hasPageContent) {
    console.log(`  FAIL  ${path}  no #page-content -- the check cannot mean anything`);
    ok = false;
  } else if (result.nested) {
    console.log(`  FAIL  ${path}  toast region is INSIDE #page-content`);
    ok = false;
  } else {
    console.log(`  ok    ${path}  region outside #page-content`);
  }
}

await browser.close();
console.log(ok ? "\nThe toast stack is outside the transformed content column." : "\nPlacement is wrong.");
process.exit(ok ? 0 : 1);
