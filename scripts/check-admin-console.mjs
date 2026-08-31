/**
 * Every admin screen renders without the browser or Next.js complaining.
 *
 * The other admin harnesses assert what a screen *does* -- that a save writes,
 * that a gate holds, that an inline reorders. None of them look at whether the
 * page arrived cleanly, and two real faults lived in that gap:
 *
 *   - **`/admin` had no `export const instant = false`.** Its three sibling
 *     routes did. `cacheComponents` asks every route for a static shell, the
 *     first thing this one does is read the session, and the result was a
 *     "Next.js encountered uncached data during a navigation" insight on the
 *     only admin route without the line. Nothing failed; it was just slower
 *     than it looked, and only the dev overlay ever said so.
 *
 *   - **The image preview computed its URL in the browser.** `mediaUrl` reads
 *     `STORAGE_SUPABASE_URL`, which is not a `NEXT_PUBLIC_` variable, so the
 *     server produced an absolute URL and the client an empty host. React
 *     reports that as a hydration mismatch and then leaves the attribute alone,
 *     which is why the preview looked right: it only broke on the next client
 *     render, and pressing Save is one.
 *
 * Both are invisible to `tsc`, to `eslint` and to a build. What sees them is a
 * real browser, which is what this is.
 *
 * Read-only. It opens every screen and writes nothing; `/new` is skipped for
 * the models whose descriptor says `canCreate: false`, where a 404 is the
 * intended answer rather than a fault -- an account is made by a sign-in and a
 * guestbook message by a reader, so there is no blank form to offer.
 *
 * Needs `--conditions=react-server` for the descriptors, which reach the
 * storage module.
 *
 *   npx tsx --conditions=react-server scripts/check-admin-console.mjs [base]
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

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push(pass);
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

/**
 * Noise a clean page still produces, and which asserting on would only teach
 * the next person to ignore this script. Nothing here is about the admin: the
 * favicon is genuinely absent in dev, and the Turnstile widget is not on any
 * admin screen but its script is loaded by the root layout.
 */
const IGNORE = [/favicon/i, /turnstile/i, /Download the React DevTools/i];

/**
 * A real key for a model, for the edit screen to be opened on.
 *
 * This asked for `/1`, which was the first row back when keys were serial. Keys
 * are uuids now, so `1` is not a key that could exist -- the screen answers
 * "not found", correctly, and the sweep reads a page that never rendered a form
 * as a pass. Ask the table what it actually holds instead.
 */
async function sampleId(key) {
  const model = listModelFor(key);
  if (!model) return null;
  const [row] = await db.select({ id: model.pk }).from(model.from).limit(1);
  return row ? String(row.id) : null;
}

const routes = ["/admin"];
for (const entry of ADMIN_ENTRIES) {
  /*
   * Where the screen lives, asked of the registry rather than written down. A
   * Settings screen is a tab at `/admin/<section>/<key>` and its flat URL is
   * refused, so `/admin/${entry.key}` would sweep seventeen not-found pages --
   * which render quietly, and so would be reported as seventeen clean screens.
   */
  const screen = adminPath(entry);
  routes.push(screen);
  if (entry.singleton) continue;
  // A model with no rows has no edit screen to open, and that is not a fault.
  const id = await sampleId(entry.key);
  if (id) routes.push(`${screen}/${id}`);
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

const faults = [];

for (const path of routes) {
  // A page each, because the dev overlay counts issues for the lifetime of the
  // page -- one shared page would attribute the first fault to every route
  // after it.
  const page = await context.newPage();
  const noise = [];
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text().split("\n")[0];
    if (!IGNORE.some((pattern) => pattern.test(text))) noise.push(text);
  });
  page.on("pageerror", (error) => noise.push(`uncaught: ${error.message.split("\n")[0]}`));

  const response = await page.goto(BASE + path, { waitUntil: "load" });
  await page.waitForTimeout(1500);

  /*
   * The overlay's own verdict, read from the badge rather than from the
   * console. An insight -- a route that could have been prerendered and was not
   * -- is reported through the overlay and never printed to the console at all,
   * so watching `console` alone would have missed the first of the two faults
   * above entirely.
   */
  const badge = await page.evaluate(() => {
    const root = document.querySelector("nextjs-portal")?.shadowRoot;
    const element = root?.querySelector("[data-next-badge]");
    if (!element) return null;
    return {
      error: element.getAttribute("data-error") === "true",
      insight: element.getAttribute("data-insights-only") === "true",
    };
  });

  const status = response?.status() ?? 0;
  const problems = [
    status >= 400 ? `HTTP ${status}` : null,
    badge?.error ? "the overlay reports an error" : null,
    badge?.insight ? "the overlay reports an insight" : null,
    ...noise,
  ].filter(Boolean);

  if (problems.length) faults.push({ path, problems });
  await page.close();
}

check(
  `all ${routes.length} admin screens render without an error or an insight`,
  faults.length === 0,
  faults.map((f) => `${f.path}: ${f.problems[0]}`).join("; ").slice(0, 200),
);

for (const fault of faults) {
  for (const problem of fault.problems.slice(0, 3)) {
    console.log(`        ${fault.path}  ${problem.slice(0, 140)}`);
  }
}

await browser.close();

const failed = checks.filter((pass) => !pass).length;
console.log(
  failed === 0
    ? `\nThe admin is quiet across ${routes.length} screens.`
    : `\n${failed} check(s) FAILED.`,
);
process.exit(failed === 0 ? 0 : 1);
