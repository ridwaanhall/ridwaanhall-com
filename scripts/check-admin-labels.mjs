/**
 * A label's hit area is its own content, and nothing beside it.
 *
 * `<label for=…>` activates its control from anywhere inside the label's box,
 * and a label is a grid item in the admin's field rows. Grid items are
 * blockified and stretched, so the box becomes the whole cell -- the full width
 * of the label column and the full height of the row -- while the word inside
 * it occupies a corner. Every field row therefore carried a rectangle of empty
 * space silently wired to a control.
 *
 * For most kinds that is invisible: clicking beside "Title" focuses the title
 * box, which is what a stray click would do anyway. For two kinds it is not.
 *
 *   - **An image field opens the operating system's file picker.** The label
 *     beside "Photo" measured 102x138 around 39x18 of text, so 95% of that
 *     rectangle read as blank margin and opened a file dialog. Beside a
 *     rich-text field the dead area was 230x1257 -- a full column of the page.
 *   - **A checkbox toggles.** "Remove this image" and "Featured" ran the width
 *     of the column, so a click well clear of the words armed a deletion or
 *     flipped a published flag, with only a checkmark a scroll away to say so.
 *
 * None of it is visible to `tsc`, to `eslint` or to a build: the markup is
 * correct, the association is correct, and the fault is entirely in the size of
 * a box that CSS grew. What sees it is a browser, measuring.
 *
 * So this measures every label on every admin form screen and fails when one
 * reaches further beyond its own content -- its text runs plus any control
 * nested inside it -- than padding explains. Then it does the reported thing
 * once for real: clicks the far corner of a file field's label and fails if a
 * file picker opens.
 *
 * Read-only; it opens forms and submits nothing.
 *
 * Needs `--conditions=react-server` for the descriptors, which reach the
 * storage module, and `npm run dev` running.
 *
 *   npx tsx --conditions=react-server scripts/check-admin-labels.mjs [base]
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const { chromium } = await import("playwright");
const { staffAccountId } = await import("./fixture-ids.mjs");
const { encode } = await import("next-auth/jwt");
const { ADMIN_ENTRIES, adminPath } = await import("../lib/admin/registry.ts");
const { formModelFor, listModelFor } = await import("../lib/admin/models/index.ts");
const { db } = await import("../lib/db/client.ts");

const BASE = process.argv[2] ?? "http://localhost:3000";
const COOKIE = "authjs.session-token";

/**
 * How far a label may exceed its content, in CSS pixels, on any edge.
 *
 * Not zero: a label carries real padding -- the field rows use `pt-1.5` to sit
 * the word on the same line as the control beside it -- and that padding is
 * adjacent to the text it belongs to and clickable by design. What this is
 * sized to catch is a box grown by the *layout* rather than by the label:
 * stretching to a neighbour's height, or to a column's width, puts tens or
 * hundreds of pixels of unrelated space inside a control's reach.
 */
const SLACK = 12;

/**
 * Sideways overhang is only measured on a label that fits on one line.
 *
 * A label whose text wraps ends its last line short, and the box it wrapped
 * inside stays the full width it was given -- "Handwritten Digit Recognition"
 * breaks after "Digit" and leaves 79px of the second line unused. That tail is
 * the end of a line of text, reads as part of the words, and is clickable in
 * any paragraph on the web. CSS has no width that means "the longest line", so
 * it cannot be trimmed away and should not be.
 *
 * A single-line label has no such excuse: every pixel to the right of its one
 * line is space the layout gave it, which is exactly the "Featured" case at
 * 477px around 83px of word. Height is measured either way, because no amount
 * of wrapping explains a box that continues 114px below its last line.
 */
const wrapped = (lines) => lines > 1;

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push(pass);
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

/** A real key for a model, so an edit screen opens on a form and not on a 404. */
async function sampleId(key) {
  const model = listModelFor(key);
  if (!model) return null;
  const [row] = await db.select({ id: model.pk }).from(model.from).limit(1);
  return row ? String(row.id) : null;
}

const routes = [];
for (const entry of ADMIN_ENTRIES) {
  /*
   * Where the screen lives, asked of the registry rather than written down. A
   * Settings screen is a tab at `/admin/<section>/<key>` and its flat URL is
   * refused; a not-found page carries no form and so no labels, which this
   * would read as seventeen screens with nothing to measure -- a pass.
   */
  const screen = adminPath(entry);
  if (entry.singleton) {
    routes.push(screen);
    continue;
  }
  const id = await sampleId(entry.key);
  if (id) routes.push(`${screen}/${id}`);
  // A blank form reaches states a populated one does not: an image field with
  // nothing stored renders no preview, and so a shorter row.
  if (formModelFor(entry.key)?.canCreate !== false) routes.push(`${screen}/new`);
}

const token = await encode({
  token: { sub: await staffAccountId() },
  secret: process.env.AUTH_SECRET,
  salt: COOKIE,
  maxAge: 60 * 30,
});

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.addCookies([{ name: COOKIE, value: token, domain: "localhost", path: "/" }]);

/**
 * Every label on the page, with how far its box reaches past its own content.
 *
 * "Content" is the union of the label's text runs and of any control nested
 * inside it, because a checkbox label legitimately contains its checkbox. The
 * overhang is measured per edge rather than as a share of the area, so that a
 * label which is merely too tall reads the same as one which is merely too
 * wide. Both are the same fault.
 */
const measure = () =>
  [...document.querySelectorAll("form label")]
    .map((label) => {
      const box = label.getBoundingClientRect();
      if (!box.width || !box.height) return null;
      const range = document.createRange();
      range.selectNodeContents(label);
      const runs = [...range.getClientRects()].filter((rect) => rect.width && rect.height);
      const parts = [
        ...runs,
        ...[...label.querySelectorAll("input, select, textarea, img, svg")].map((node) =>
          node.getBoundingClientRect(),
        ),
      ].filter((rect) => rect.width && rect.height);
      if (!parts.length) return null;
      const ink = {
        left: Math.min(...parts.map((rect) => rect.left)),
        right: Math.max(...parts.map((rect) => rect.right)),
        top: Math.min(...parts.map((rect) => rect.top)),
        bottom: Math.max(...parts.map((rect) => rect.bottom)),
      };
      return {
        label: (label.textContent || "").replace(/\s+/g, " ").trim().slice(0, 32) || "(blank)",
        control: label.htmlFor || label.querySelector("input")?.type || "?",
        box: `${Math.round(box.width)}x${Math.round(box.height)}`,
        // One line per distinct top edge. A run split by an inline element sits
        // on the top it shares with the rest of its line.
        lines: new Set(runs.map((rect) => Math.round(rect.top))).size,
        tall: Math.round(Math.max(ink.top - box.top, box.bottom - ink.bottom)),
        wide: Math.round(Math.max(ink.left - box.left, box.right - ink.right)),
      };
    })
    .filter(Boolean);

const offenders = [];
// A route that resolves to "Nothing here" has no labels either, and an empty
// sweep of zero offenders is indistinguishable from a clean one -- exactly
// the gap a broken URL in `routes` would hide in. Tracked so the sweep fails
// loudly on a not-found page instead of quietly measuring nothing on it.
const formless = [];
let labelCount = 0;
// Noted while sweeping rather than guessed at: not every model has an image
// field, and a route picked by its shape would quietly test nothing.
let fileRoute = null;

for (const path of routes) {
  const page = await context.newPage();
  await page.goto(BASE + path, { waitUntil: "load" });
  // The rich-text editor and the inline rows mount after hydration, and a label
  // measured before its neighbour exists is measured against the wrong height.
  await page.waitForTimeout(1200);

  // Scoped to `<main>`, the content column `AdminMain` renders -- not just
  // `form`, because the topbar's sign-out button is *also* a form, with a
  // hidden `$ACTION_ID_…` input for its server action. Every route carries
  // that one regardless of what `<main>` renders, so an unscoped selector
  // would count it and never see zero.
  const controls = await page.locator("main form input, main form select, main form textarea").count();
  if (controls === 0) formless.push(path);

  const labels = await page.evaluate(measure);
  labelCount += labels.length;
  for (const label of labels) {
    const over = Math.max(label.tall, wrapped(label.lines) ? 0 : label.wide);
    if (over > SLACK) offenders.push({ path, over, ...label });
  }
  if (!fileRoute && (await page.locator('form input[type="file"]').count())) fileRoute = path;
  await page.close();
}

check(
  "every route actually renders a form, not a not-found page with nothing to measure",
  formless.length === 0,
  formless.join(", "),
);

check(
  `no label reaches more than ${SLACK}px past its own content ` +
    `(${labelCount} labels, ${routes.length} screens)`,
  offenders.length === 0,
  offenders.length ? `${offenders.length} do` : "",
);

for (const offender of offenders.sort((a, b) => b.over - a.over).slice(0, 12)) {
  console.log(
    `        ${String(offender.over).padStart(4)}px past  ${offender.box.padEnd(10)} ` +
      `${offender.control.padEnd(26)} ${offender.label}  ${offender.path}`,
  );
}

/*
 * The reported symptom, done for real. The measurement above catches it by
 * proxy; this is the thing a person actually did, and a file picker either
 * opens or it does not.
 *
 * Two clicks, because half a fix passes the first one. The blank corner of the
 * row must open nothing -- and the word "Photo" must still open the picker,
 * since a label that has stopped naming its input would be blameless by every
 * measurement here and useless to anyone reading the form.
 */
if (!fileRoute) throw new Error("No admin form screen renders a file input; nothing to click beside.");

const page = await context.newPage();
await page.goto(BASE + fileRoute, { waitUntil: "load" });
await page.waitForTimeout(1200);

const points = await page.evaluate(() => {
  const file = document.querySelector('form input[type="file"]');
  if (!file || !file.id) return null;
  const label = document.querySelector(`label[for="${CSS.escape(file.id)}"]`);
  const row = label?.parentElement;
  if (!label || !row) return null;
  row.scrollIntoView({ block: "center" });
  const box = label.getBoundingClientRect();
  const cell = row.getBoundingClientRect();
  // The bottom-left of the row: the label's column, below the one line of text
  // in it. That is the space the stretched box used to cover.
  return {
    blank: { x: cell.left + 4, y: cell.bottom - 4 },
    word: { x: box.left + box.width / 2, y: box.top + box.height / 2 },
    clear: Math.round(cell.bottom - box.bottom),
  };
});

if (!points) {
  check("a file field's label was found to click beside", false, `none on ${fileRoute}`);
} else if (points.clear < 20) {
  // Not a pass by default: with no room below the label there is no blank space
  // to click, and the check would be reporting on nothing.
  check("the file field's row has blank space below its label to click", false, `${points.clear}px`);
} else {
  let picker = false;
  page.on("filechooser", () => {
    picker = true;
  });

  await page.mouse.click(points.blank.x, points.blank.y);
  await page.waitForTimeout(600);
  check("clicking the blank part of a file field's row opens no file picker", !picker, fileRoute);

  picker = false;
  await page.mouse.click(points.word.x, points.word.y);
  await page.waitForTimeout(600);
  check("clicking the label's own text still opens the file picker", picker, fileRoute);
}

await page.close();
await browser.close();
await db.$client.end();

const failed = checks.filter((pass) => !pass).length;
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed ? 1 : 0);
