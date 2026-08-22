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
   * `/about/` is shorter than live at every width. Measured live vs. port with
   * all three flags set: 50 at 375, 18 at 768, 6 at 1280.
   *
   * Two things account for it. Most of it is the intro's status badge row, as
   * below. The last 4px at 375 and 768 is the tab strip: its buttons carried a
   * 2px `border-b-2` that switched colour to mark the active tab, and the mark
   * is now one absolutely-positioned bar that slides between them -- so each
   * button is 2px shorter, and those two widths wrap the strip onto two rows.
   * At 1280 it is one row, so the 2px falls inside the tolerance and 6 stands.
   *
   * Three requested changes compound here:
   *
   * - The row wraps rather than shrinking. The original let three badges be
   *   crushed onto one line beside the heading: at 768 that pushes the document
   *   to 924px wide, 156px past the viewport, with each pill 74px tall because
   *   its own label has wrapped inside it; at 375 the third badge starts past
   *   the right edge entirely.
   * - The badges say one word below `sm` -- Open / Hiring / Unwell -- instead of
   *   spelling out "Under the Weather" on a phone, and no longer prefix the
   *   full label with "Currently" above it.
   * - They carry no dot and no fill. That is what changed these numbers last:
   *   the dot and its margin were 12px of width per badge, and losing them is
   *   what lets all three sit on one line at 375 and at 768 where they took two
   *   before. A pill is a flat 22px at every width against live's 74 / 74 / 34,
   *   so the saving is one whole line plus the height difference.
   *
   * At 1280 both sides fit on one line either way, and the port is simply 6px
   * shorter because the pill is -- which is why that number did not move.
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
  /*
   * `/` is 26px shorter at 768, and every one of the ten differences is that
   * same 26px: `main` loses it, and the three action buttons, four cards and
   * two headings below the hero all move up by it.
   *
   * One cause. The hero's availability badges lost their pulsing dot, and each
   * dot was 12px of width including its margin -- enough, at 768, for the row
   * to fit beside the role and location on one line where live wraps it onto
   * two. 375 and 1280 are unaffected: at 375 both sides wrap, at 1280 neither
   * does.
   */
  ...["action[0]", "action[1]", "action[2]", "card[0]", "card[1]", "card[2]", "card[3]", "h2[0]", "h2[1]"].map(
    (key) => ({ path: "/", key, dimension: "y", delta: 26, widths: [768] }),
  ),
  { path: "/", key: "main", dimension: "h", delta: 26, widths: [768] },

  /*
   * `/openhire/` is no longer comparable to live element by element, and there
   * is deliberately no entry for it.
   *
   * The page was restructured on request: the Curriculum Vitae block became the
   * about page's banner, which is an `h3` rather than an `h2` section, and the
   * three requirement cards came out of their grid to run full width. Every
   * `h2` after the first therefore has a different index than live's, which
   * this reports as twenty-odd heading-text mismatches -- true, and none of
   * them a fault. Writing an exemption per shifted index would only encode the
   * offset until the next edit moved it again.
   *
   * The path still runs; read the output rather than expecting silence. What it
   * is good for now is comparing the port against itself across a change, which
   * is what the whole `compare-*` set is for once the migration is done.
   */

  /*
   * `/guestbook/` is 43px shorter than live, and its `h1` measures 24px wider.
   *
   * The height is the panel shedding its chrome. The header bar went first --
   * a filled strip reading "Guestbook Messages" directly under a heading that
   * already said "Guestbook", with the count as a badge inside it -- and the
   * pinned block followed, losing the fill and the rule that made it a second
   * surface holding surfaces. What is left is a caption, the pinned cards and
   * the messages.
   *
   * The width is not from that change and predates it: live wraps its heading
   * in one more `div` than the port does, 816px inside the same 840px column,
   * so the port's `h1` spans the full width. Measured through the parent chain
   * on both sides. Nothing else on the page differs, so it has been left as it
   * is rather than adding a wrapper whose only job is to match.
   */
  { path: "/guestbook/", key: "main", dimension: "h", delta: 43, widths: [1280] },
  { path: "/guestbook/", key: "h1", dimension: "w", delta: -24, widths: [1280] },

  { path: "/about/", key: "main", dimension: "h", delta: 50, widths: [375] },
  { path: "/about/", key: "main", dimension: "h", delta: 18, widths: [768] },
  { path: "/about/", key: "main", dimension: "h", delta: 6, widths: [1280] },

  /*
   * `/dashboard/`'s two section headings are smaller than live's, and the page
   * is 8px shorter for it.
   *
   * They were `text-xl sm:text-2xl`, so 24px type in a 32px line box; they are
   * `text-xl` -- 20px in a 28px box -- which is the size the contact page's
   * headings already used. 4px of height each is the 8px on `main`, and `h2[1]`
   * sits 4px higher because the heading above it shrank.
   *
   * The widths are the same change seen sideways: the port's smaller type sets
   * "WakaTime Statistics" 37px narrower and "GitHub Statistics" 32px narrower
   * than live's. Two entries, because the deltas are the strings' own.
   */
  { path: "/dashboard/", key: "h2[0]", dimension: "h", delta: 4, widths: [1280] },
  { path: "/dashboard/", key: "h2[0]", dimension: "w", delta: 37, widths: [1280] },
  { path: "/dashboard/", key: "h2[1]", dimension: "h", delta: 4, widths: [1280] },
  { path: "/dashboard/", key: "h2[1]", dimension: "y", delta: 4, widths: [1280] },
  { path: "/dashboard/", key: "h2[1]", dimension: "w", delta: 32, widths: [1280] },
  { path: "/dashboard/", key: "main", dimension: "h", delta: 8, widths: [1280] },
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
