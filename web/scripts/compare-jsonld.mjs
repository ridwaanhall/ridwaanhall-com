/**
 * Compare the JSON-LD blocks on each page against the live Django site.
 *
 * Structured data is the part of the migration where a wrong key costs
 * something real and says nothing when it breaks: Google drops a property it
 * cannot parse without reporting it, so a missing `@type` or a malformed date
 * shows up as rich results quietly disappearing weeks later.
 *
 *   node scripts/compare-jsonld.mjs [nextBase] [liveBase]
 */
const NEXT = process.argv[2] ?? "http://localhost:3000";
const LIVE = process.argv[3] ?? "https://ridwaanhall.com";

const PAGES = [
  "/", "/about/", "/blog/", "/projects/", "/dashboard/", "/contact/",
  "/guestbook/", "/privacy-policy/", "/terms/",
  "/blog/commit-message-style-guide/", "/projects/pddikti-data-vault/",
];

/**
 * Properties whose value legitimately differs, with the reason.
 *
 * `dateModified` on pages that track no real modification date: Django read the
 * clock, so the value changed on every request and claimed the page had just
 * changed. The port uses the build time, or the row's own timestamp where one
 * exists.
 *
 * `wordCount`: Django read a key the blog dict never carried, so it always
 * emitted 0 -- a stated value that is simply wrong. The port counts the body.
 */
const EXPECTED_DIFFS = new Set(["dateModified", "wordCount"]);

/**
 * Whole paths that differ for a recorded reason.
 *
 * The terms document's URL: Django's `get_absolute_url` returns
 * `/legal/terms-and-conditions/` while its own sitemap, footer and search modal
 * all use `/terms/`. The port follows the sitemap, since that is the URL that
 * is actually indexed.
 */
const EXPECTED_PATH_DIFFS = [
  { page: "/terms/", key: "url" },
  { page: "/terms/", key: "itemListElement[1].item" },
];

function extractJsonLd(html) {
  const out = [];
  for (const m of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      out.push(JSON.parse(m[1].replace(/\\u003c/g, "<")));
    } catch {
      out.push({ __parseError: m[1].slice(0, 120) });
    }
  }
  return out;
}

/** Flatten to `path -> value` so two trees can be compared key by key. */
function flatten(node, prefix = "", out = {}) {
  if (node === null || typeof node !== "object") {
    out[prefix] = node;
    return out;
  }
  if (Array.isArray(node)) {
    node.forEach((item, i) => flatten(item, `${prefix}[${i}]`, out));
    return out;
  }
  for (const [k, v] of Object.entries(node)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  return out;
}

let problems = 0;

for (const path of PAGES) {
  const [nextHtml, liveHtml] = await Promise.all([
    fetch(NEXT + path).then((r) => r.text()),
    fetch(LIVE + path).then((r) => r.text()),
  ]);

  const live = extractJsonLd(liveHtml);
  const next = extractJsonLd(nextHtml);

  const types = (blocks) => blocks.map((b) => b["@type"] ?? "?").join(", ");

  if (live.length !== next.length) {
    problems++;
    console.log(`  DIFF  ${path}  block count ${live.length} -> ${next.length}`);
    console.log(`          live: ${types(live)}`);
    console.log(`          next: ${types(next)}`);
    continue;
  }

  const diffs = [];
  for (let i = 0; i < live.length; i++) {
    const a = flatten(live[i]);
    const b = flatten(next[i]);
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of keys) {
      const leaf = key.split(".").pop().replace(/\[\d+\]$/, "");
      if (EXPECTED_DIFFS.has(leaf)) continue;
      if (EXPECTED_PATH_DIFFS.some((e) => e.page === path && e.key === key)) continue;
      if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
        diffs.push({ block: live[i]["@type"], key, live: a[key], next: b[key] });
      }
    }
  }

  if (diffs.length === 0) {
    console.log(`  ok    ${path}  (${types(next)})`);
  } else {
    problems++;
    console.log(`  DIFF  ${path}  ${diffs.length} difference(s)`);
    for (const d of diffs.slice(0, 6)) {
      console.log(`          ${d.block}.${d.key}`);
      console.log(`            live: ${JSON.stringify(d.live)?.slice(0, 100)}`);
      console.log(`            next: ${JSON.stringify(d.next)?.slice(0, 100)}`);
    }
    if (diffs.length > 6) console.log(`          … and ${diffs.length - 6} more`);
  }
}

console.log(problems === 0 ? "\nAll JSON-LD matches." : `\n${problems} page(s) differ.`);
process.exit(problems === 0 ? 0 : 1);
