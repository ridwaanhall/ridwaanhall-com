/**
 * Compare rendered geometry against the live Django site, element by element.
 *
 * Eyeballing two screenshots catches a missing section; it does not catch a
 * heading that is 2px lower, a card that is 4px narrower, or a gap that lost a
 * space. This measures the things a reader would notice only in aggregate.
 *
 * Selectors are matched by role and text rather than by class, so a refactor
 * that renames a utility does not break the comparison.
 *
 *   node scripts/compare-layout.mjs [path] [nextBase] [liveBase]
 */
import { chromium } from "playwright";

const PATH = process.argv[2] ?? "/";
const NEXT = process.argv[3] ?? "http://localhost:3000";
const LIVE = process.argv[4] ?? "https://ridwaanhall.com";
const WIDTH = Number(process.env.WIDTH ?? 1280);

/** Tolerance in px. Sub-pixel layout and font hinting differ harmlessly. */
const TOLERANCE = 2;

/**
 * Differences that are expected, per path, with the reason.
 *
 * `/contact/` used to be listed here, 88px shorter because live rendered the
 * Cloudflare Turnstile widget and the port did not. The widget landed with the
 * form's submission, and the entry went with it as its own note said it should:
 * both sides now measure a 72px widget inside a 752px `main`, delta 0. Leaving
 * it would have hidden the widget disappearing again.
 */
const EXPECTED = [
  /*
   * `/about/` differs at every width, and the whole of it is the intro's status
   * badge row. Measured live vs. port with all three flags set, the `main`,
   * intro-card and badge-row deltas are the same number at each width -- 16 at
   * 375, -12 at 768, 6 at 1280 -- so nothing else on the page has moved.
   *
   * Two requested changes compound here:
   *
   * - The row wraps rather than shrinking. The original let three badges be
   *   crushed onto one line beside the heading: at 768 that pushes the document
   *   to 924px wide, 156px past the viewport, with each pill 74px tall because
   *   its own label has wrapped inside it; at 375 the third badge starts past
   *   the right edge entirely.
   * - The badges are the mobile drawer's size now (`px-2 py-0.5 text-xs`, a
   *   1.5-unit dot) and say one word below `sm` -- Open / Hiring / Unwell --
   *   instead of spelling out "Under the Weather" on a phone. A pill is a flat
   *   22px at every width as a result, against live's 74 / 74 / 34.
   *
   * The two pull opposite ways, which is why the sign changes: at 375 all three
   * compact badges now fit on one line where live needed a 74px crushed row, so
   * the port is *shorter*; at 768 they take two 22px lines where live took one
   * 74px one, so it is slightly taller; at 1280 both fit on one line and the
   * port is simply 6px shorter because the pill is.
   *
   * One entry per measured width, since the delta is not constant.
   */
  /*
   * `/blog/<slug>/` is 34px taller, and the difference is in the *article*, not
   * the comment section this was first run against.
   *
   * Measured element by element: the comment section is identical on both sides
   * -- 349px for the section, 164 for the sign-in prompt, 68 for the empty
   * message -- and the `Tags` footer above it starts 34px lower here (1854 vs
   * 1888), while the byline at the top is at y=110 on both. So the whole delta
   * accumulates inside the rich-text body, which is a departure already
   * recorded below: the stored blocks carried hand-typed, inconsistent
   * indentation, heading weights and paragraph spacing, several of which never
   * resolved at all, and `styles/prose.css` renders them uniformly.
   *
   * Pinned to the one post the harness is usually run against; other posts will
   * differ by their own amount for the same reason.
   */
  {
    path: "/blog/commit-message-style-guide/",
    key: "main",
    dimension: "h",
    delta: -34,
    widths: [1280],
  },
  // Everything below the body is pushed down by the same 34px: `Tags` and the
  // comment heading. Their own heights match, which is what says the shift is
  // inherited rather than theirs.
  {
    path: "/blog/commit-message-style-guide/",
    key: "h2[0]",
    dimension: "y",
    delta: -34,
    widths: [1280],
  },
  {
    path: "/blog/commit-message-style-guide/",
    key: "h2[1]",
    dimension: "y",
    delta: -34,
    widths: [1280],
  },
  /*
   * `/projects/<slug>/` is the same story as the blog post above: the comment
   * section measures 349px on both sides, `Description` is at y=819 on both,
   * and the 72px appears between there and `Features` -- inside the rich-text
   * description. Everything after it inherits the shift.
   */
  ...["h2[1]", "h2[2]", "h2[3]"].map((key) => ({
    path: "/projects/pddikti-data-vault/",
    key,
    dimension: "y",
    delta: -72,
    widths: [1280],
  })),
  {
    path: "/projects/pddikti-data-vault/",
    key: "main",
    dimension: "h",
    delta: -72,
    widths: [1280],
  },
  { path: "/about/", key: "main", dimension: "h", delta: 16, widths: [375] },
  { path: "/about/", key: "main", dimension: "h", delta: -12, widths: [768] },
  { path: "/about/", key: "main", dimension: "h", delta: 6, widths: [1280] },
];

/**
 * Is this difference one of the recorded ones?
 *
 * `key` is matched, which it previously was not: every entry carried one, but
 * the call site hard-coded `key === "main"`, so the field was decorative and no
 * exemption could ever be written for anything else. A body that changes height
 * moves every heading below it, and those are separate measurements.
 */
/**
 * `/about` and `/about/` are the same page to this table.
 *
 * The port dropped its trailing slashes while live still carries Django's, so
 * either form reaches both sides -- one of them through a 308 the browser
 * follows. Matching an entry on the exact string would silently disable every
 * exemption depending on which form was typed.
 */
const samePath = (a, b) => a.replace(/\/+$/, "") === b.replace(/\/+$/, "");

function expected(key, dimension, live, next) {
  return EXPECTED.some(
    (e) =>
      samePath(e.path, PATH) &&
      e.key === key &&
      e.dimension === dimension &&
      (e.widths === undefined || e.widths.includes(WIDTH)) &&
      Math.abs(live - next - e.delta) <= TOLERANCE,
  );
}

async function measure(browser, base) {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 1200 } });
  // `load` rather than `networkidle`: the live contact page embeds Cloudflare
  // Turnstile, which holds a connection open, so networkidle never fires and the
  // navigation times out. A fixed settle afterwards covers fonts and images.
  await page.goto(base + PATH, { waitUntil: "load", timeout: 60000 });
  // Let the entrance animation settle so nothing is measured mid-transform.
  await page.waitForTimeout(1200);

  const result = await page.evaluate(() => {
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    };
    const text = (el) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
    const out = {};

    const h1 = document.querySelector("main h1");
    out["h1"] = box(h1);
    out["h1:text"] = text(h1);

    document.querySelectorAll("main h2").forEach((h2, i) => {
      out[`h2[${i}]`] = box(h2);
      out[`h2[${i}]:text`] = text(h2);
    });

    // The hero's action buttons.
    const buttons = [...document.querySelectorAll("main a")].filter((a) =>
      a.className.includes?.("action-btn"),
    );
    buttons.forEach((b, i) => {
      out[`action[${i}]`] = box(b);
      out[`action[${i}]:text`] = text(b);
    });

    // The first row of cards, whatever they are on this page.
    const cards = [...document.querySelectorAll("main a > div")].filter((d) => {
      const r = d.getBoundingClientRect();
      return r.width > 200 && r.height > 200;
    });
    cards.slice(0, 4).forEach((c, i) => {
      out[`card[${i}]`] = box(c);
    });

    out["main"] = box(document.querySelector("main"));
    return out;
  });

  await page.close();
  return result;
}

const browser = await chromium.launch();
const [live, next] = await Promise.all([measure(browser, LIVE), measure(browser, NEXT)]);
await browser.close();

const keys = [...new Set([...Object.keys(live), ...Object.keys(next)])].sort();
let problems = 0;

for (const key of keys) {
  const a = live[key];
  const b = next[key];

  if (key.endsWith(":text")) {
    if (a !== b) {
      problems++;
      console.log(`  DIFF  ${key}\n          live: ${a}\n          next: ${b}`);
    }
    continue;
  }
  if (!a || !b) {
    problems++;
    console.log(`  DIFF  ${key}  live=${a ? "present" : "absent"} next=${b ? "present" : "absent"}`);
    continue;
  }
  const deltas = ["x", "y", "w", "h"].filter(
    (d) => Math.abs(a[d] - b[d]) > TOLERANCE && !expected(key, d, a[d], b[d]),
  );
  if (deltas.length) {
    problems++;
    console.log(
      `  DIFF  ${key}  ${deltas.map((d) => `${d}: ${a[d]} -> ${b[d]}`).join(", ")}`,
    );
  }
}

console.log(
  problems === 0
    ? `\n${PATH} matches the live layout at ${WIDTH}px (±${TOLERANCE}px).`
    : `\n${problems} difference(s) on ${PATH} at ${WIDTH}px.`,
);
process.exit(problems === 0 ? 0 : 1);
