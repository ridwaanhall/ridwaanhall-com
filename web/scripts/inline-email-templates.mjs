/**
 * Inline the Django email templates into a TypeScript module.
 *
 * The five HTML/text pairs under `apps/core/templates/core/email/` are 62KB of
 * hand-tuned, table-based email markup that renders correctly across mail
 * clients. Re-authoring them as react-email components -- the original plan --
 * would mean transcribing all of it into JSX, where a silent divergence would
 * only show up in someone's inbox. Copying them verbatim keeps the emails
 * exactly as they are.
 *
 * They cannot simply be read at runtime: Next bundles server code, so a
 * `readFileSync` of a template beside the source needs the file traced into the
 * deployment and behaves differently in dev, in a standalone build and on
 * Vercel. Inlining sidesteps all of that -- they become plain strings.
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

const files = readdirSync(SOURCE).sort();
const entries = files.map((file) => {
  const body = readFileSync(path.join(SOURCE, file), "utf8").replace(/\r\n/g, "\n");
  const key = file
    .replace(/\.html$/, "_html")
    .replace(/\.txt$/, "_text")
    .replace(/_(\w)/g, (_, c) => c.toUpperCase());

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

const header = `/**
 * The site's transactional email bodies, five HTML/text pairs.
 *
 * Copied **verbatim** from \`apps/core/templates/core/email/\` by
 * \`scripts/inline-email-templates.mjs\` -- not re-authored. They are 62KB of
 * hand-tuned, table-based markup that renders correctly across mail clients,
 * and all five share the dark palette the site uses (\`#09090b\` canvas,
 * \`#18181b\` card, \`#6366f1\` indigo accent).
 *
 * Placeholders are \`{{ key }}\`, filled by \`lib/email/render.ts\`. That module is
 * where the port improves on the original: Django replaced tokens with
 * \`str.replace\` and left an unmatched \`{{ key }}\` sitting in the sent email --
 * exactly the trap CLAUDE.md warns about. Rendering here fails loudly instead.
 *
 * Regenerate with \`node scripts/inline-email-templates.mjs\` while the Django
 * tree still exists; after cutover this file is the source.
 */

`;

const body = entries
  .map(
    ({ key, file, escaped }) =>
      `/** \`${file}\` */\nexport const ${key} = ${BACKTICK}${escaped}${BACKTICK};\n`,
  )
  .join("\n");

writeFileSync(OUT, header + body, "utf8");
console.log(`wrote ${OUT}`);
for (const { key, file } of entries) console.log(`  ${file.padEnd(36)} -> ${key}`);
