/**
 * A `loading.tsx` stands in for exactly one page.
 *
 * This is the file-layout half of the skeletons, and it is the half that has no
 * symptom until somebody navigates. `check-skeleton-shape.mjs` measures each
 * skeleton against the page it is *meant* to cover; nothing measured whether it
 * is also being shown in front of pages it was never drawn for.
 *
 * It is, whenever a route is nested under it. Next stores a segment's loading
 * module on that segment's cache node and applies it to the segment's child
 * slots -- `layout-router.js` calls it `parentLoadingData` -- so a
 * `loading.tsx` is the Suspense fallback for *everything the layout beside it
 * renders as children*, not for its own `page.tsx` alone. Where a segment has
 * nested routes, its skeleton answers for all of them.
 *
 * Which one wins is then a race the reader loses. On a client-side navigation
 * the target segment's payload is not in the router cache yet, so the boundary
 * that renders is the nearest one already known -- the parent's. The target's
 * own `loading.tsx` arrives inside the payload it is supposed to be covering
 * the wait for, and only gets its turn where the parent boundary never had to
 * suspend at all. So the wrong skeleton shows precisely on the slow
 * navigations, which are the ones a skeleton exists for.
 *
 * That is what this site shipped. The home page's skeleton sat at the root of
 * the `(site)` group, so it was that page's stand-in *and* the fallback for
 * every route beside it: a click on Dashboard drew a hero, a card rail and a
 * skills marquee, then replaced them with five panels. The blog and projects
 * indexes did the same to their detail routes, and both admin levels to
 * everything under them -- the admin worst of all, because nothing there is
 * prerendered, so every single navigation took the slow path where the parent
 * boundary wins.
 *
 * The fix is a route group with nothing in it but the page and its skeleton:
 * `(home)`, `(index)`. The URL is unchanged -- a group is not a path segment --
 * but it *is* a router segment, so the skeleton moves down to a node with no
 * children to stand in front of, and the parent slot is left with no loading
 * data at all. A navigation whose payload is still in flight then keeps the
 * previous page on screen (the progress bar is what reports it) rather than
 * flashing somebody else's furniture, and the skeleton that eventually renders
 * is the right one.
 *
 * Offline and deterministic: it reads the `app/` tree and nothing else.
 *
 *   node scripts/check-skeleton-scope.mjs
 */
import { readdirSync, statSync } from "node:fs";
import path from "node:path";

const APP = path.resolve(import.meta.dirname, "..", "app");

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push(pass);
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

/** Every directory under `app/`, as a path relative to it. */
function walk(dir, rel = "") {
  const out = [rel];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    // Nothing here is routable, and `_`-prefixed folders are private by
    // convention -- Next does not route them either.
    if (entry.startsWith("_")) continue;
    out.push(...walk(full, rel ? `${rel}/${entry}` : entry));
  }
  return out;
}

const has = (rel, file) => {
  try {
    statSync(path.join(APP, rel, file));
    return true;
  } catch {
    return false;
  }
};

const dirs = walk(APP).filter(Boolean);

/** A segment is routable when it renders a page. Route handlers are not. */
const routes = new Set(dirs.filter((d) => has(d, "page.tsx")));
const skeletons = dirs.filter((d) => has(d, "loading.tsx"));

console.log(`app/ — ${routes.size} route(s), ${skeletons.length} skeleton(s)\n`);

check("every route group with a skeleton has one to find", skeletons.length > 0);

for (const dir of skeletons) {
  /*
   * Routes below this one. A group segment -- `(home)`, `(index)` -- is not a
   * path, but it *is* a node in the router tree with its own cache entry, which
   * is exactly what puts the skeleton out of the way of its siblings. So the
   * comparison is on the directory tree rather than on the URL.
   */
  const nested = [...routes].filter((r) => r !== dir && r.startsWith(`${dir}/`));

  check(
    `app/${dir}/loading.tsx covers its own page and no other`,
    nested.length === 0,
    nested.length ? `also stands in front of ${nested.map((r) => `/${r}`).join(", ")}` : "",
  );

  check(
    `app/${dir}/loading.tsx has a page to stand in for`,
    routes.has(dir),
    routes.has(dir) ? "" : "no page.tsx beside it",
  );
}

const failed = checks.filter((pass) => !pass).length;
console.log(`\n${checks.length - failed}/${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
