/**
 * The compiled stylesheet contains nothing the site does not use.
 *
 * Tailwind finds classes by scanning every non-ignored file and treating any
 * word that parses as a class name as one in use. Prose counts: a design note,
 * a README, or a code comment that merely *names* a utility is enough to emit
 * it, and a single comment using one of these words in an ordinary
 * English sense kept the bare utility alive after every real occurrence had been
 * deleted.
 *
 * That was contained while the app lived in `web/` -- the notes and the markdown
 * were outside the project root, so outside the scan. Promoting the app to the
 * repo root brought them all back in, and the first build after the move
 * re-emitted every one of the depth utilities this site removed on purpose. The
 * `@source not` lines in `app/globals.css` are the fix; this is what proves they
 * still work, because nothing else would notice.
 *
 * Run after `npm run build`.
 *
 *   node scripts/check-css-sources.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Utility families the site deliberately does not use.
 *
 * Written as patterns rather than literals so this file does not itself become
 * the thing that emits them -- which is not a hypothetical: `app/globals.css`
 * and `next.config.ts` both had to stop spelling these out before the build came
 * back clean.
 */
const FORBIDDEN = [
  { name: "cast depth", pattern: new RegExp(`\\.${"shadow"}[-\\\\a-z0-9/]*\\s*\\{`, "g") },
];

function cssFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "cache") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...cssFiles(path));
    else if (entry.name.endsWith(".css")) found.push(path);
  }
  return found;
}

let dir;
try {
  dir = statSync(".next").isDirectory() ? ".next" : null;
} catch {
  dir = null;
}

if (!dir) {
  console.log("No .next directory — run `npm run build` first.");
  process.exit(1);
}

const sheets = cssFiles(dir);
if (sheets.length === 0) {
  console.log("No compiled stylesheet found — run `npm run build` first.");
  process.exit(1);
}

let failures = 0;
for (const { name, pattern } of FORBIDDEN) {
  const hits = new Set();
  for (const sheet of sheets) {
    for (const match of readFileSync(sheet, "utf8").matchAll(pattern)) {
      hits.add(match[0].replace(/\s*\{$/, ""));
    }
  }
  const ok = hits.size === 0;
  if (!ok) failures++;
  console.log(
    `  ${ok ? "ok  " : "FAIL"}  no ${name} utilities are emitted${ok ? "" : `  ${[...hits].join(", ")}`}`,
  );
}

console.log(
  failures === 0
    ? `\nThe compiled CSS is clean (${sheets.length} sheet(s)).`
    : `\n${failures} check(s) FAILED. Something in the tree names a utility the site does not use — check the @source not lines in app/globals.css, and any comment you just wrote.`,
);
process.exit(failures === 0 ? 0 : 1);
