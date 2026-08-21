/**
 * Inline the Django *plain-text* email bodies into a TypeScript module.
 *
 * Only the five `.txt` halves. Their HTML counterparts were the old dark
 * templates and have been redesigned in the site's light theme, composed from
 * `lib/email/layout.ts` -- one shell rather than five files that had to be
 * edited in step. There is no design in a text body to redo, and it is what a
 * client that will not render HTML shows, so those keep their original wording.
 *
 * They cannot simply be read at runtime: Next bundles server code, so a
 * `readFileSync` beside the source needs the file traced into the deployment
 * and behaves differently in dev, in a standalone build and on Vercel. Inlining
 * sidesteps all of that -- they become plain strings.
 *
 * Run while the Django tree still exists; after cutover the generated module is
 * the source of truth and this script goes with the templates.
 *
 *   node scripts/inline-email-templates.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const SOURCE = path.resolve(import.meta.dirname, "../../apps/core/templates/core/email");
const OUT = path.resolve(import.meta.dirname, "../lib/email/templates.ts");

const BACKSLASH = String.fromCharCode(92);
const BACKTICK = String.fromCharCode(96);

const files = readdirSync(SOURCE)
  .filter((file) => file.endsWith(".txt"))
  .sort();

const entries = files.map((file) => {
  const body = readFileSync(path.join(SOURCE, file), "utf8").replace(/\r\n/g, "\n");
  const key = file.replace(/\.txt$/, "_text").replace(/_(\w)/g, (_, c) => c.toUpperCase());

  // The three sequences that would end a template literal or open an
  // interpolation. Backslash first, or the escapes added below get re-escaped.
  const escaped = body
    .split(BACKSLASH)
    .join(BACKSLASH + BACKSLASH)
    .split(BACKTICK)
    .join(BACKSLASH + BACKTICK)
    .split("${")
    .join(BACKSLASH + "${");

  return { key, file, escaped };
});

const header = [
  "/**",
  " * The **plain-text** halves of the five transactional emails.",
  " *",
  " * Copied verbatim from `apps/core/templates/core/email/*.txt` by",
  " * `scripts/inline-email-templates.mjs`. There is no design in them to redo,",
  " * and they are what a client that will not render HTML shows, so they keep",
  " * the wording the site has always sent.",
  " *",
  " * Their HTML counterparts are **not** here. Those were the old dark templates",
  " * and have been redesigned in the site's light theme, composed from",
  " * `lib/email/layout.ts` -- one shell rather than five files that had to be",
  " * edited in step.",
  " *",
  " * Placeholders are `{{ key }}`, filled by `lib/email/render.ts`, which throws",
  " * on an unmatched one. Django's `str.replace` left it sitting in the sent",
  " * email, which CLAUDE.md records as a gotcha with no test covering it.",
  " */",
  "",
  "",
].join("\n");

const body = entries
  .map(
    ({ key, file, escaped }) =>
      `/** \`${file}\` */\nexport const ${key} = ${BACKTICK}${escaped}${BACKTICK};\n`,
  )
  .join("\n");

writeFileSync(OUT, header + body, "utf8");
console.log(`wrote ${OUT}`);
for (const { key, file } of entries) console.log(`  ${file.padEnd(36)} -> ${key}`);
