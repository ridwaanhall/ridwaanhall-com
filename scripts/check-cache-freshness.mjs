/**
 * A cached page is not served past the time it was allowed to live, and the
 * dashboard's "Today" panel names today.
 *
 *   node scripts/check-cache-freshness.mjs [base] [--watch SECONDS] [--for SECONDS] [--allow-missing-stamp]
 *
 * `base` (or CHECK_BASE_URL) defaults to https://ridwaanhall.com; http://localhost:3000
 * works too. Read-only HTTP: no database, no react-server conditions.
 *
 * Each public route is fetched as HTML and as an RSC payload (`RSC: 1`). Age
 * above the route's `initialExpireSeconds` in .next/prerender-manifest.json is a
 * FAIL (the CDN served past expire); above `initialRevalidateSeconds` a WARN.
 * Without a manifest the routes are a fixed list and no age can be judged.
 *
 * `--watch N` repeats every N seconds (for `--for` seconds, default 120) so a
 * STALE first hit followed by a fresh second hit shows up as evidence.
 */
import { existsSync, readFileSync } from "node:fs";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : Number(args[i + 1]);
};
const allowMissing = args.includes("--allow-missing-stamp");
const watch = flag("--watch");
const duration = flag("--for") ?? 120;
const positional = args.find((a) => /^https?:\/\//.test(a));
const BASE = (positional ?? process.env.CHECK_BASE_URL ?? "https://ridwaanhall.com").replace(/\/+$/, "");

const FALLBACK = ["/", "/dashboard", "/about", "/projects", "/blog", "/guestbook"];
const manifestPath = new URL("../.next/prerender-manifest.json", import.meta.url);
let limits = {};
let routes = FALLBACK;
if (existsSync(manifestPath)) {
  const { routes: r = {} } = JSON.parse(readFileSync(manifestPath, "utf8"));
  const pages = Object.entries(r).filter(
    ([k, v]) =>
      typeof v.initialRevalidateSeconds === "number" &&
      !/^\/(admin|api|_|sign-in)/.test(k) &&
      !k.includes(".") &&
      k.split("/").length <= 2 &&
      !/^\/cv-/.test(k),
  );
  if (pages.length) {
    routes = pages.map(([k]) => k);
    limits = Object.fromEntries(pages.map(([k, v]) => [k, v]));
  }
}

const GUARDED = ["/dashboard", "/"];
const DEFAULT_ZONE = "Asia/Jakarta";
let ZONE = DEFAULT_ZONE;
const validZone = (z) => { try { new Intl.DateTimeFormat("en-CA", { timeZone: z }); return true; } catch { return false; } };
const dayIn = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: ZONE }).format(d);
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

let failures = 0;
const fail = (msg) => { failures++; console.log(`  FAIL  ${msg}`); };
const warn = (msg) => console.log(`  WARN  ${msg}`);
const ok = (msg) => console.log(`  ok    ${msg}`);

async function hit(path, rsc) {
  const res = await fetch(BASE + path, { headers: rsc ? { RSC: "1" } : {}, redirect: "manual" });
  const body = await res.text();
  const h = (n) => res.headers.get(n) ?? "-";
  return {
    path, kind: rsc ? "rsc" : "html", status: res.status, body,
    cache: h("x-vercel-cache"), age: res.headers.get("age") === null ? null : Number(res.headers.get("age")),
    cc: h("cache-control"), stale: h("x-nextjs-stale-time"),
  };
}

async function round() {
  const rows = [];
  for (const path of routes) for (const rsc of [false, true]) rows.push(await hit(path, rsc));
  console.log(`\n${new Date().toISOString()}  ${BASE}`);
  console.log("route".padEnd(16) + "kind".padEnd(6) + "status".padEnd(8) + "cache".padEnd(10) + "age".padEnd(8) + "stale-time".padEnd(12) + "cache-control");
  for (const r of rows) {
    console.log(r.path.padEnd(16) + r.kind.padEnd(6) + String(r.status).padEnd(8) + r.cache.padEnd(10) + String(r.age ?? "-").padEnd(8) + r.stale.padEnd(12) + r.cc);
  }
  for (const r of rows) {
    const lim = limits[r.path];
    const id = `${r.path} (${r.kind}) age ${r.age}`;
    if (r.status >= 500) { fail(`${r.path} (${r.kind}) answered ${r.status}`); continue; }
    if (r.status >= 400) warn(`${r.path} (${r.kind}) answered ${r.status}`);
    if (!lim || r.age === null) continue;
    if (typeof lim.initialExpireSeconds === "number" && r.age > lim.initialExpireSeconds) fail(`${id} > expire ${lim.initialExpireSeconds}`);
    else if (r.age > lim.initialRevalidateSeconds) warn(`${id} > revalidate ${lim.initialRevalidateSeconds}`);
  }

  const zoneOf = (body, label) => {
    // The guard's props carry the account's zone; quotes are escaped in an RSC string.
    const z = body.match(/timeZone\\?"\s*:\s*\\?"([A-Za-z_+\-/0-9]+)/);
    if (!z) { console.log(`  ..    ${label}: no timeZone in the payload; using ${DEFAULT_ZONE} (default)`); return DEFAULT_ZONE; }
    if (validZone(z[1])) { console.log(`  ..    ${label}: zone from payload: ${z[1]}`); return z[1]; }
    console.log(`  ..    ${label}: payload zone "${z[1]}" is not a valid IANA zone; using ${DEFAULT_ZONE}`);
    return DEFAULT_ZONE;
  };
  for (const route of GUARDED) {
    const mine = rows.filter((r) => r.path === route);
    const html = mine.find((r) => r.kind === "html");
    if (!html) continue;
    ZONE = zoneOf(html.body, route);
    if (route === "/dashboard") {
      const m = html.body.match(/Today, so far<\/h3><p[^>]*>([A-Za-z]+) (\d{1,2}), (\d{4})/);
      if (!m) fail("dashboard: Today panel date not found");
      else {
        const shown = `${m[3]}-${String(MONTHS.indexOf(m[1]) + 1).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
        if (shown !== dayIn(new Date())) fail(`dashboard Today panel shows ${shown}, ${ZONE} is ${dayIn(new Date())}`);
        else ok(`dashboard Today panel shows ${shown}, matching ${ZONE}`);
      }
    }
    for (const r of mine) {
      // In an RSC payload the quotes are JSON-escaped inside a string, in HTML they are plain.
      const f = r.body.match(/fetched_?[aA]t(?:\\)?"\s*:\s*(\d{12,})/);
      if (!f) {
        if (r.kind !== "html") continue;
        if (allowMissing) console.log(`  ..    ${route}: no fetchedAt stamp in the payload (not shipped yet)`);
        else fail(`${route} carries no fetchedAt stamp`);
        continue;
      }
      const at = new Date(Number(f[1]));
      const mins = (Date.now() - at.getTime()) / 60000;
      if (mins > 30) fail(`${route} (${r.kind}) fetchedAt ${at.toISOString()} is ${mins.toFixed(0)} min old`);
      else if (dayIn(at) !== dayIn(new Date())) fail(`${route} (${r.kind}) fetchedAt ${at.toISOString()} is a different ${ZONE} day`);
      else ok(`${route} (${r.kind}) fetchedAt ${mins.toFixed(1)} min old`);
    }
  }
}

const end = Date.now() + duration * 1000;
await round();
if (watch) while (Date.now() + watch * 1000 <= end) {
  await new Promise((r) => setTimeout(r, watch * 1000));
  await round();
}
console.log(failures ? `\n${failures} failed` : "\nall passed");
process.exit(failures ? 1 : 0);
