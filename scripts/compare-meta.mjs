/**
 * Compare rendered <head> metadata against the live Django site, page by page.
 *
 * Titles, descriptions and canonical URLs are what currently appears in search
 * results, so a difference here is a real SEO regression -- and one that no
 * type check or build can see.
 *
 *   node scripts/compare-meta.mjs [nextBase] [liveBase]
 */
const NEXT = process.argv[2] ?? "http://localhost:3000";
const LIVE = process.argv[3] ?? "https://ridwaanhall.com";

const PAGES = ["/", "/about/", "/blog/", "/projects/", "/dashboard/", "/contact/", "/guestbook/", "/privacy-policy/", "/terms/", "/blog/commit-message-style-guide/", "/projects/pddikti-data-vault/"];

/** Tags worth comparing. Order-independent, whitespace-normalised. */
function extract(html) {
  const out = {};
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (title) out.title = decode(title[1].trim());
  for (const m of html.matchAll(/<meta\s+([^>]+)>/gi)) {
    const attrs = m[1];
    const name = /(?:name|property)=["']([^"']+)["']/i.exec(attrs)?.[1];
    const content = /content=["']([^"']*)["']/i.exec(attrs)?.[1];
    if (name && content !== undefined) out[name] = decode(content);
  }
  const canonical = /<link[^>]+rel=["']canonical["'][^>]*>/i.exec(html);
  if (canonical) out["link:canonical"] = decode(/href=["']([^"']+)["']/i.exec(canonical[0])?.[1] ?? "");
  return out;
}

const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
   .replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&#x2F;/g, "/")
   .replace(/\s+/g, " ").trim();

/**
 * `keywords` on the two list pages is compared by *count*, not by content.
 *
 * Django builds it as `list(set(tags))[:8]` -- slicing an unordered set, so
 * which eight of the ~30 available tags survive is arbitrary and changes
 * between server restarts (Python randomises string hashing per process). The
 * port takes the first eight in list order instead, which is deterministic.
 * Comparing the exact strings would therefore fail against a value that is not
 * stable on the Django side either.
 *
 * The tag has been ignored by every major search engine since 2009, so this is
 * a difference in an inert field; the length check still catches a keyword
 * list that stopped being generated.
 */
const COUNT_ONLY = new Set(["keywords"]);

/**
 * `article:published_time` / `article:modified_time` are compared as instants,
 * not as strings.
 *
 * Django emitted the *rendered* datetime -- "Jan. 23, 2026, 8:55 p.m." -- because
 * meta_tags.html interpolated a Python datetime straight into the attribute and
 * Django's template layer formats it for humans. Open Graph requires ISO 8601,
 * so that value is unparseable by every consumer of it. The port emits real
 * ISO 8601; this check confirms the two still denote the same moment.
 */
const INSTANT = new Set(["article:published_time", "article:modified_time"]);

/** Parse either form to epoch ms, or NaN. */
function instant(value) {
  if (!value) return NaN;
  const direct = Date.parse(value);
  if (!Number.isNaN(direct)) return direct;
  // "Jan. 23, 2026, 8:55 p.m." -- Django's default, in the site's timezone.
  const m = /^([A-Za-z]+)\.?\s+(\d+),\s*(\d{4}),\s*(\d+):(\d+)\s*([ap])\.?m\.?$/i.exec(value.trim());
  if (!m) return NaN;
  const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  const month = months.indexOf(m[1].slice(0, 3).toLowerCase());
  let hour = Number(m[4]) % 12;
  if (m[6].toLowerCase() === "p") hour += 12;
  // Asia/Jakarta is UTC+7 and observes no DST.
  return Date.UTC(Number(m[3]), month, Number(m[2]), hour - 7, Number(m[5]));
}

const COMPARE = [
  "title", "description", "keywords", "link:canonical",
  "og:title", "og:description", "og:type", "og:image", "og:site_name",
  "twitter:card", "twitter:title", "twitter:description", "twitter:image", "twitter:site",
  "article:published_time", "article:modified_time",
];

/**
 * Tags whose value is a URL on this site.
 *
 * Compared with the trailing slash normalised away: the port serves `/about`
 * where Django serves `/about/`, a deliberate site-wide change, and the old
 * form 308s to the new one. Comparing the strings exactly would flag every page
 * forever and drown the differences that matter.
 */
const SITE_URL_TAGS = new Set(["link:canonical", "og:url"]);
const withoutSlash = (value) => value.replace(/\/+(?=$|\?)/, "");

const diffsFor = (a, b) =>
  COMPARE.filter((k) => {
    let [x, y] = [a[k] ?? "", b[k] ?? ""];
    if (SITE_URL_TAGS.has(k)) {
      [x, y] = [withoutSlash(x), withoutSlash(y)];
    }
    if (COUNT_ONLY.has(k)) {
      return x.split(",").filter(Boolean).length !== y.split(",").filter(Boolean).length;
    }
    if (INSTANT.has(k)) {
      if (!x && !y) return false;
      return instant(x) !== instant(y);
    }
    return x !== y;
  }).map((k) => ({ k, live: a[k] ?? "<absent>", next: b[k] ?? "<absent>" }));

let mismatches = 0;
for (const path of PAGES) {
  const [nextHtml, liveHtml] = await Promise.all([
    fetch(NEXT + path).then((r) => r.text()),
    fetch(LIVE + path).then((r) => r.text()),
  ]);
  const a = extract(liveHtml);
  const b = extract(nextHtml);


  const diffs = diffsFor(a, b);

  if (diffs.length === 0) {
    console.log(`  ok    ${path}`);
  } else {
    mismatches += diffs.length;
    console.log(`  DIFF  ${path}  (${diffs.length})`);
    for (const d of diffs) {
      console.log(`          ${d.k}`);
      console.log(`            live: ${String(d.live).slice(0, 110)}`);
      console.log(`            next: ${String(d.next).slice(0, 110)}`);
    }
  }
}
console.log(mismatches === 0 ? "\nAll compared meta tags match." : `\n${mismatches} tag difference(s).`);
