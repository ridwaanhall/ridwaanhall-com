/**
 * Every response carries the security headers, and the policy names what the
 * app actually loads.
 *
 * These do not come for free. The platform adds none, and a framework adds none
 * -- so a deployment with no `headers()` entry serves a site with no CSP, no
 * HSTS, no frame protection and no referrer policy at all. Nothing in a build,
 * a type check or a lint notices, because nothing is wrong with the code.
 *
 *   node scripts/check-headers.mjs [base]
 *
 * Needs the app running (`npm run dev`). Read-only: it makes GET requests and
 * asserts on what comes back.
 *
 * **The origins are derived, not written down twice.** A policy is only as good
 * as its agreement with the code, and the failure mode of a stale one is a
 * blocked script rather than a compile error -- so the expected origins below
 * come from the same environment the app builds its own URLs from, and the
 * check fails if the policy omits one.
 */
import { config } from "dotenv";

// The Supabase host is the one origin here that is not a literal, and checking
// a policy without it would leave the site's own uploaded media unverified.
config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const BASE = process.argv[2] ?? "http://localhost:3000";

let failures = 0;
const check = (ok, label, detail = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}${ok || !detail ? "" : `  ${detail}`}`);
};

const get = async (path) => {
  const response = await fetch(`${BASE}${path}`, { redirect: "manual" });
  await response.arrayBuffer();
  return response.headers;
};

/** The headers every response must carry, and what counts as a correct value. */
const REQUIRED = [
  ["x-content-type-options", (v) => v === "nosniff", "nosniff"],
  ["x-frame-options", (v) => v === "DENY", "DENY"],
  ["referrer-policy", (v) => v === "strict-origin-when-cross-origin", "strict-origin-when-cross-origin"],
  ["cross-origin-opener-policy", (v) => v === "same-origin", "same-origin"],
  ["permissions-policy", (v) => v.includes("camera=()") && v.includes("microphone=()"), "camera and microphone denied"],
  ["strict-transport-security", (v) => /max-age=\d{7,}/.test(v), "a max-age of at least ~4 months"],
];

/*
 * Every origin the application loads something from, taken from the same place
 * the application takes it. A policy that omits one of these blocks a real
 * request; one that lists an origin nothing uses is a widened policy nobody
 * asked for.
 */
const supabaseHost = process.env.STORAGE_SUPABASE_URL
  ? new URL(process.env.STORAGE_SUPABASE_URL).hostname
  : null;
if (!supabaseHost) {
  console.log("  ..    STORAGE_SUPABASE_URL is unset, so the media origin is not checked");
}

const EXPECTED_ORIGINS = {
  "img-src": [
    "'self'",
    "data:",
    ...(supabaseHost ? [`https://${supabaseHost}`] : []),
    "https://lh3.googleusercontent.com", // Google avatars, in the guestbook
    "https://avatars.githubusercontent.com", // GitHub avatars, likewise
    "https://www.gravatar.com", // the fallback avatar
  ],
  "script-src": ["'self'", "'unsafe-inline'", "https://challenges.cloudflare.com"],
  "frame-src": ["https://challenges.cloudflare.com"], // the Turnstile widget
  "connect-src": ["'self'", "https://challenges.cloudflare.com"],
  "font-src": ["'self'"], // next/font self-hosts Onest under /_next/static/media
};

/** The directives that have to be there whatever else is. */
const REQUIRED_DIRECTIVES = [
  ["default-src", "'self'"],
  ["object-src", "'none'"],
  ["base-uri", "'self'"],
  ["form-action", "'self'"],
  ["frame-ancestors", "'none'"],
];

const parsePolicy = (value) =>
  Object.fromEntries(
    value
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [name, ...sources] = part.split(/\s+/);
        return [name, sources];
      }),
  );

console.log(`Security headers at ${BASE}\n`);

try {
  const headers = await get("/");

  for (const [name, valid, expected] of REQUIRED) {
    const value = headers.get(name);
    check(value !== null, `${name} is set`, `expected ${expected}`);
    if (value !== null) check(valid(value), `${name} says what it should`, `got "${value}"`);
  }

  /*
   * Report-only counts. Enforcing a policy before its reports have been watched
   * is how a deploy takes its own scripts down; what matters here is that a
   * policy exists and is right.
   */
  const raw =
    headers.get("content-security-policy") ?? headers.get("content-security-policy-report-only");
  check(raw !== null, "a content security policy is set", "neither enforcing nor report-only");

  if (raw) {
    const enforcing = headers.get("content-security-policy") !== null;
    console.log(`        (${enforcing ? "enforcing" : "report-only"})`);

    const policy = parsePolicy(raw);

    for (const [directive, source] of REQUIRED_DIRECTIVES) {
      check(
        policy[directive]?.includes(source),
        `${directive} is ${source}`,
        `got ${policy[directive]?.join(" ") ?? "nothing"}`,
      );
    }

    for (const [directive, origins] of Object.entries(EXPECTED_ORIGINS)) {
      const listed = policy[directive] ?? [];
      const missing = origins.filter((origin) => !listed.includes(origin));
      check(
        missing.length === 0,
        `${directive} names every origin the app loads from (${origins.length})`,
        `missing: ${missing.join(", ")}`,
      );
    }

    check(
      !(policy["script-src"] ?? []).includes("'unsafe-eval'"),
      "script-src does not allow eval",
    );
  }

  // A header set only on the document is a header most requests do not get.
  const api = await get("/api/blog?all=1");
  check(
    api.get("x-content-type-options") === "nosniff",
    "the headers reach an API route too, not only a page",
    `got "${api.get("x-content-type-options")}"`,
  );
} catch (error) {
  failures++;
  console.log(`  FAIL  ${error.message}`);
  console.log(`\nIs the app running at ${BASE}? (npm run dev)`);
}

console.log(
  failures === 0
    ? "\nEvery response is carrying its security headers."
    : `\n${failures} check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
