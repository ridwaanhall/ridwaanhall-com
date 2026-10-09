/**
 * A class name used in the public site that is also a Tailwind utility picks
 * up that utility's declarations. `ring` on the back-to-top SVG gained a
 * box-shadow and drew a square around a circle. Offline: run after a build.
 *
 *   npm run build && node scripts/check-class-collisions.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const css = readdirSync(".next/static/chunks").filter((f) => f.endsWith(".css")).map((f) => readFileSync(join(".next/static/chunks", f), "utf8")).join("\n");
// Only the utilities layer: the rest of the sheet is the site's own rules, which
// are supposed to use these class names. Braces are matched, not guessed.
function layerBody(text) {
  const at = text.indexOf("@layer utilities");
  if (at === -1) return "";
  let depth = 0;
  for (let i = text.indexOf("{", at); i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}" && --depth === 0) return text.slice(text.indexOf("{", at) + 1, i);
  }
  return "";
}
const layer = layerBody(css);
const utilities = new Set([...layer.matchAll(/(?:^|[\s}])\.([a-z][a-z0-9-]*)\s*\{/g)].map((m) => m[1]));

const walk = (dir) => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(p) ? [p] : []; });
const files = [...walk("components/foothill"), ...walk("app/(site)")];
const used = new Map();
for (const f of files) for (const m of readFileSync(f, "utf8").matchAll(/class(?:Name)?=(?:"([^"]*)"|\{`([^`]*)`\})/g)) for (const c of (m[1] ?? m[2]).split(/\s+/)) if (utilities.has(c)) used.set(c, [...(used.get(c) ?? []), f]);
// Utilities the public site uses on purpose: `fill-ink` colours the logo mark, nothing else.
const INTENDED = new Set(["container", "fill-ink"]);
const hits = [...used].filter(([c]) => !INTENDED.has(c));
if (hits.length) { for (const [c, f] of hits) console.log(`  FAIL  "${c}" is a Tailwind utility, used in ${[...new Set(f)].join(", ")}`); process.exit(1); }
console.log(`  ok    no public class collides with a Tailwind utility (${utilities.size} utilities checked)`);
