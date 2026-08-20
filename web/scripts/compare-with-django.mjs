/**
 * Compare the Next.js API output against Django's manager output, field by field.
 *
 * This is the check that catches the failure mode a migration like this
 * actually has: not a crash, but a key that quietly changed name, a date that
 * lost its timezone, or a list that came back in a different order. None of
 * that is visible from looking at a rendered page.
 *
 *   1. cd .. && DEBUG=False uv run python web/scripts/django_dump.py
 *   2. start the Next dev server
 *   3. node scripts/compare-with-django.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.NEXT_BASE ?? "http://localhost:3000";
const django = JSON.parse(readFileSync(join(here, ".django.json"), "utf8"));

/** Which API call reproduces which key of the Django dump. */
const CASES = [
  ["about", "/api/about/"],
  ["experiences", "/api/experiences/"],
  ["experiences_current", "/api/experiences/?current_only=true"],
  ["education", "/api/education/"],
  ["education_last", "/api/education/?last_only=true"],
  ["certifications", "/api/certifications/"],
  ["skills", "/api/skills/"],
  ["skills_by_category", "/api/skills/?grouped=1"],
  ["awards", "/api/awards/"],
  ["applications", "/api/applications/"],
  ["blogs", "/api/blog/?all=1"],
  ["projects", "/api/projects/?all=1"],
  ["hiring", "/api/openhire/hiring/"],
  ["open_to_work", "/api/openhire/open-to-work/"],
  ["legal_documents", "/api/legal/"],
];

/**
 * `is_active` is recomputed from the clock on every read by design, so the two
 * sides can legitimately straddle a boundary. Everything else must match.
 */
const IGNORED_PATHS = new Set([
  // Recomputed from the clock on every read by design, so the two sides can
  // legitimately straddle a working-hours boundary.
  "about.is_active",
  // Deliberate: Django's LegalDocument.get_absolute_url() special-cases only
  // the privacy policy and returns /legal/terms-and-conditions/ for terms --
  // but /terms/ is the URL in the sitemap, in the footer of every page and in
  // the search modal, i.e. the one that is actually canonical and indexed.
  // Django's own field disagreed with Django's own sitemap; the port follows
  // the sitemap. Only the legal page's sibling cross-links read this.
  "legal_documents[1].url",
]);

/**
 * Paths where a difference is expected and understood.
 *
 * `journey` is the one intentional behavioural change in the data layer.
 * Django ordered journey steps by `timestamp` alone, so steps sharing a
 * timestamp came back in Postgres heap order -- arbitrary, and not stable
 * across a VACUUM. Nine of the 59 multi-step applications are affected. The
 * port adds `id` as a tiebreak, giving insertion order for simultaneous
 * events.
 *
 * The ordering is exempted; the *contents* are not -- the check below still
 * compares both sides as multisets, so a step that went missing or gained a
 * changed field still fails.
 */
const ORDER_INSENSITIVE = [/^applications\[\d+\]\.journey$/];

function diff(expected, actual, path = "", out = []) {
  if (IGNORED_PATHS.has(path)) return out;

  if (ORDER_INSENSITIVE.some((re) => re.test(path)) && Array.isArray(expected) && Array.isArray(actual)) {
    const canon = (list) => list.map((item) => JSON.stringify(item)).sort();
    const [a, b] = [canon(expected), canon(actual)];
    if (a.length !== b.length) {
      out.push({ path: `${path}.length`, expected: a.length, actual: b.length });
    } else if (a.some((item, i) => item !== b[i])) {
      const missing = a.filter((item) => !b.includes(item));
      const extra = b.filter((item) => !a.includes(item));
      for (const item of [...missing, ...extra].slice(0, 3)) {
        out.push({
          path,
          expected: missing.includes(item) ? item : "<absent>",
          actual: extra.includes(item) ? item : "<absent>",
        });
      }
    }
    return out;
  }

  if (expected === null || actual === null || typeof expected !== "object" || typeof actual !== "object") {
    if (expected !== actual) out.push({ path, expected, actual });
    return out;
  }

  if (Array.isArray(expected) !== Array.isArray(actual)) {
    out.push({ path, expected: `array=${Array.isArray(expected)}`, actual: `array=${Array.isArray(actual)}` });
    return out;
  }

  if (Array.isArray(expected)) {
    if (expected.length !== actual.length) {
      out.push({ path: `${path}.length`, expected: expected.length, actual: actual.length });
    }
    for (let i = 0; i < Math.min(expected.length, actual.length); i++) {
      diff(expected[i], actual[i], `${path}[${i}]`, out);
    }
    return out;
  }

  const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
  for (const key of keys) {
    const child = path ? `${path}.${key}` : key;
    if (!(key in actual)) out.push({ path: child, expected: expected[key], actual: "<missing>" });
    else if (!(key in expected)) out.push({ path: child, expected: "<absent in django>", actual: actual[key] });
    else diff(expected[key], actual[key], child, out);
  }
  return out;
}

const short = (v) => {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s === undefined ? "undefined" : s.length > 90 ? `${s.slice(0, 90)}…` : s;
};

let failures = 0;
let skipped = 0;

for (const [key, path] of CASES) {
  if (!(key in django)) {
    console.log(`  ?     ${key.padEnd(22)} not in django dump`);
    continue;
  }

  let body;
  try {
    const res = await fetch(BASE + path);
    if (res.status === 404) {
      console.log(`  --    ${key.padEnd(22)} ${path} not implemented yet`);
      skipped++;
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    body = (await res.json()).data;
  } catch (error) {
    console.log(`  FAIL  ${key.padEnd(22)} ${path} -> ${error.message}`);
    failures++;
    continue;
  }

  const problems = diff(django[key], body, key);
  if (problems.length === 0) {
    const size = Array.isArray(body) ? `${body.length} items` : "object";
    console.log(`  ok    ${key.padEnd(22)} ${size}`);
  } else {
    failures++;
    console.log(`  FAIL  ${key.padEnd(22)} ${problems.length} difference(s)`);
    for (const p of problems.slice(0, 8)) {
      console.log(`          ${p.path}\n            django: ${short(p.expected)}\n            next:   ${short(p.actual)}`);
    }
    if (problems.length > 8) console.log(`          … and ${problems.length - 8} more`);
  }
}

console.log(
  failures === 0
    ? `\nAll compared endpoints match Django${skipped ? ` (${skipped} not implemented yet)` : ""}.`
    : `\n${failures} endpoint(s) differ.`,
);
process.exit(failures === 0 ? 0 : 1);
