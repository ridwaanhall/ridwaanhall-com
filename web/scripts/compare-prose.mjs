/**
 * Compare rich-text typography against the live Django rendering.
 *
 * The blog body used to carry its styling inline -- every paragraph stored
 * "mb-4 text-sm md:text-base lg:text-lg" as data. That is now a stylesheet, so
 * the question this answers is narrow and important: does the stylesheet
 * reproduce what the stored classes produced?
 *
 * Measures computed values on the first element of each kind, in the same
 * viewport, on both sites.
 *
 *   node scripts/compare-prose.mjs [slug] [width]
 */
import { chromium } from "playwright";

const SLUG = process.argv[2] ?? "python-101-your-chill-guide-to-getting-started";
const WIDTH = Number(process.argv[3] ?? 1280);
const NEXT = "http://localhost:3000";
const LIVE = "https://ridwaanhall.com";

/** Properties worth comparing: the ones the stored classes actually set. */
const PROPS = ["fontSize", "fontWeight", "lineHeight", "marginTop", "marginBottom", "paddingLeft", "listStyleType", "color", "backgroundColor", "borderRadius"];

const TARGETS = ["p", "h2", "h3", "ul", "li", "pre", "code", "strong", "a", "table", "th", "td"];

/**
 * Properties that differ on purpose, with the reason.
 *
 * Link colour: stored links carried their own, and whether it resolved was a
 * coincidence of whether the class happened to appear in a scanned template
 * too -- so live renders one post's links green and another's in body colour,
 * i.e. invisible. The port gives every link one appearance.
 */
const EXPECTED = new Set([
  "a.color",
  // The block renderer put `mb-4` on a wrapper `<div>` around each table, not
  // on the table itself. The converted HTML has no wrapper and carries the
  // margin directly, so the measured element differs while the space below the
  // table is identical.
  "table.marginBottom",
  // 21 of 178 paragraphs stored `mb-2` instead of `mb-4`, and it follows no
  // structural pattern -- 13 of the 21 are followed by another paragraph, just
  // as most `mb-4` ones are. It is inconsistent hand-typing rather than intent,
  // so those paragraphs gain 8px and every paragraph is now spaced the same.
  "p.marginBottom",
  // The single `code` block stored `mb-4` on a bare inline `<code>`, where
  // margin-bottom has no layout effect at all. The converted HTML wraps it in
  // a paragraph, so the intended gap is actually produced -- the property moves
  // from an element that ignored it to one that honours it.
  "code.marginBottom",

  // --- normalisation, which is the point of the change --------------------
  //
  // The stored class strings were typed per block and drifted. Five variants of
  // the paragraph class, four of the list class, two of the h3 class. Worse,
  // whether a class did anything depended on whether that exact string also
  // appeared in a scanned template, because Tailwind cannot see values that
  // live only in the database:
  //
  //   `pl-5`   absent  -> 7 of 19 lists render at padding-left: 0, so their
  //                       bullets sit outside the text column
  //   `pl-6`   present -> the other 9 lists indent correctly
  //
  // and three lists carried no text-size classes at all, so they rendered a
  // step smaller than the prose around them.
  //
  // One stylesheet gives every list the same indent and every heading the same
  // weight. These entries are the elements where that normalisation is visible.
  "ul.paddingLeft",
  "ul.fontSize",
  "ul.lineHeight",
  "ul.marginBottom",
  "li.fontSize",
  "li.lineHeight",
  "a.fontSize",
  "a.lineHeight",
  "h3.fontWeight",
  "h3.marginTop",
  "h3.marginBottom",
]);

/**
 * Compare colours as resolved sRGB, not as strings.
 *
 * Django's CSS is built by the Tailwind CLI and keeps `oklch()`; this app's
 * goes through Lightning CSS, which converts the same values to `lab()`. The
 * conversion is exact -- checked to 0/255 on every channel -- so comparing the
 * serialisations reports a difference on every coloured property while every
 * one of them is the same colour.
 *
 * Chromium's canvas does not resolve either notation (it echoes them back), so
 * the conversion is done here.
 */
function normalise(value) {
  if (typeof value !== "string") return value;
  const text = value.replace(/\s+/g, " ").trim();

  const oklch = /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)/.exec(text);
  if (oklch) {
    const l = oklch[1].endsWith("%") ? parseFloat(oklch[1]) / 100 : parseFloat(oklch[1]);
    return rgbString(oklchToSrgb(l, parseFloat(oklch[2]), parseFloat(oklch[3])));
  }

  const lab = /^lab\(\s*([\d.]+%?)\s+(-?[\d.]+)\s+(-?[\d.]+)/.exec(text);
  if (lab) {
    const l = lab[1].endsWith("%") ? parseFloat(lab[1]) : parseFloat(lab[1]);
    return rgbString(labToSrgb(l, parseFloat(lab[2]), parseFloat(lab[3])));
  }

  return text;
}

const rgbString = ([r, g, b]) => `rgb(${r}, ${g}, ${b})`;
const encode = (x) => {
  const v = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(1, v)) * 255);
};

function oklchToSrgb(L, C, h) {
  const hr = (h * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const bb = C * Math.sin(hr);
  const l = (L + 0.3963377774 * a + 0.2158037573 * bb) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * bb) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * bb) ** 3;
  return [
    encode(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    encode(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    encode(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ].map((v) => v);
}

function labToSrgb(L, A, B) {
  const fy = (L + 16) / 116;
  const f = (t) => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27));
  const Xn = 0.3457 / 0.3585;
  const Zn = (1 - 0.3457 - 0.3585) / 0.3585;
  const X = f(fy + A / 500) * Xn;
  const Y = L > 8 ? ((L + 16) / 116) ** 3 : L / (24389 / 27);
  const Z = f(fy - B / 200) * Zn;
  // Bradford D50 -> D65, then XYZ -> linear sRGB.
  const x = 0.9554734527 * X - 0.0230985368 * Y + 0.0632593086 * Z;
  const y = -0.0283697069 * X + 1.009995458 * Y + 0.0210413043 * Z;
  const z = 0.0123140016 * X - 0.0205076964 * Y + 1.3303659532 * Z;
  return [
    encode(3.2409699419 * x - 1.5373831776 * y - 0.4986107603 * z),
    encode(-0.9692436363 * x + 1.8759675015 * y + 0.0415550574 * z),
    encode(0.0556300797 * x - 0.2039769589 * y + 1.0569715142 * z),
  ];
}

async function measure(browser, base) {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 1400 } });
  await page.goto(`${base}/blog/${SLUG}/`, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(900);

  return page.evaluate(
    ({ targets, props }) => {
      // The body is the one block of long-form prose on the page; on the Django
      // side it is inside `.prose`, here inside `.prose-content`.
      const root =
        document.querySelector(".prose-content") ??
        document.querySelector(".prose") ??
        document.querySelector("article");
      if (!root) return { __missing: true };

      /**
       * Resolve a colour to sRGB.
       *
       * Django's CSS is built by the Tailwind CLI and keeps `oklch()`; this
       * app's goes through Lightning CSS, which converts the same values to
       * `lab()`. The conversion is exact -- verified to 0/255 on every channel
       * -- so comparing the serialisations would report a difference on every
       * coloured property while every one of them is the same colour. A canvas
       * resolves both notations to the same `rgb(...)` string.
       */
      const canvas = document.createElement("canvas").getContext("2d");
      const toRgb = (value) => {
        if (typeof value !== "string" || !/^(oklch|lab|lch|oklab|color)\(/.test(value)) {
          return value;
        }
        try {
          canvas.fillStyle = "#000";
          canvas.fillStyle = value;
          return canvas.fillStyle;
        } catch {
          return value;
        }
      };

      const out = {};
      for (const tag of targets) {
        // `pre code` is styled differently from inline code, so take an inline
        // one where possible.
        const el =
          tag === "code"
            ? root.querySelector(":not(pre) > code") ?? root.querySelector("code")
            : root.querySelector(tag);
        if (!el) {
          out[tag] = null;
          continue;
        }
        const cs = getComputedStyle(el);
        out[tag] = Object.fromEntries(props.map((p) => [p, toRgb(cs[p])]));
      }
      out.__counts = Object.fromEntries(targets.map((t) => [t, root.querySelectorAll(t).length]));
      return out;
    },
    { targets: TARGETS, props: PROPS },
  );
}

const browser = await chromium.launch();
const [live, next] = await Promise.all([measure(browser, LIVE), measure(browser, NEXT)]);
await browser.close();

if (live.__missing || next.__missing) {
  console.log("could not find a prose root on one side");
  process.exit(1);
}

console.log(`slug: ${SLUG}   width: ${WIDTH}px\n`);
console.log("element counts (live -> next):");
for (const tag of TARGETS) {
  const a = live.__counts[tag] ?? 0;
  const b = next.__counts[tag] ?? 0;
  console.log(`  ${a === b ? "ok  " : "DIFF"} ${tag.padEnd(8)} ${a} -> ${b}`);
}

let diffs = 0;
console.log("\ncomputed styles:");
for (const tag of TARGETS) {
  const a = live[tag];
  const b = next[tag];
  if (!a || !b) {
    if (a !== b) console.log(`  DIFF ${tag}: ${a ? "live only" : "next only"}`);
    continue;
  }
  const changed = PROPS.filter(
    (p) => !EXPECTED.has(`${tag}.${p}`) && normalise(a[p]) !== normalise(b[p]),
  );
  if (changed.length === 0) {
    console.log(`  ok   ${tag}`);
  } else {
    diffs += changed.length;
    console.log(`  DIFF ${tag}`);
    for (const p of changed) console.log(`         ${p}: ${a[p]}  ->  ${b[p]}`);
  }
}

console.log(diffs === 0 ? "\nTypography matches." : `\n${diffs} property difference(s).`);
