/**
 * No CSS class reaches the stylesheet from the database.
 *
 * Tailwind finds classes by scanning files. Content stored in Postgres is not a
 * file, so a utility named only in a row is a rule Tailwind never emits and a
 * block that renders unstyled. This project carried the consequence for the
 * whole migration: blog bodies and project descriptions were JSONB blocks with
 * a hand-typed `class` key, and `app/globals.css` had to list twenty-nine of
 * them by hand in `@source inline(...)`, re-extracted from live data whenever
 * anyone edited a post.
 *
 * Those columns went in `drizzle/0003` and the list went with them. This is the
 * check that it stays gone, and it has two halves because there are two ways
 * back:
 *
 *   - stored HTML could start carrying classes again. `lib/utils/sanitize.ts`
 *     is what stops it -- `class` is allowed on one element and only matching
 *     `language-*` -- so the check feeds it a utility and proves it is stripped,
 *     rather than trusting the allow-list by reading it.
 *   - the JSONB columns that remain (legal sections, and `about_profile.stories`
 *     now that `drizzle/0004` has moved the live copy to `stories_html`) could
 *     start carrying a `class` key, which is what the old blocks did.
 *
 * Read-only: it writes nothing and needs no cleanup.
 *
 *   npx tsx scripts/check-db-classes.mjs
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const { sanitizeRichText } = await import("../lib/utils/sanitize.ts");
const { db, pool } = await import("../lib/db/client.ts");
const { sql } = await import("drizzle-orm");

let failures = 0;
const check = (ok, label, detail = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}${ok || !detail ? "" : `  ${detail}`}`);
};

/**
 * A utility to try to smuggle in, assembled rather than written out. A harness
 * that spells a class name is a file that names it, which is enough to make
 * Tailwind emit it -- `scripts/` is excluded from the scan in `app/globals.css`
 * for exactly this reason, and this keeps it true even if that line is lost.
 */
const PROBE = ["text", "red", "500"].join("-");
const ALLOWED = `${"language"}-python`;

// --- 1. The sanitiser strips a utility, and keeps the one class it allows ----
const smuggled = sanitizeRichText(`<p class="${PROBE}">x</p>`);
check(!smuggled.includes(PROBE), "a utility on a paragraph is stripped", smuggled);

const onCode = sanitizeRichText(`<pre><code class="${ALLOWED}">x</code></pre>`);
check(onCode.includes(ALLOWED), "the syntax-highlighting class survives", onCode);

const onCodeToo = sanitizeRichText(`<pre><code class="${ALLOWED} ${PROBE}">x</code></pre>`);
check(
  onCodeToo.includes(ALLOWED) && !onCodeToo.includes(PROBE),
  "a utility alongside it on the same element is still stripped",
  onCodeToo,
);

// --- 2. Stored HTML carries nothing but that -------------------------------
/*
 * The columns are discovered, not listed.
 *
 * Three were named here -- `blog_blogpost.content_html`,
 * `projects_project.description_html`, `about_profile.stories_html` -- and a
 * fourth added later would have been missed in silence, which is the whole
 * failure mode this guards against. Asking the catalogue instead means a new
 * `*_html` column or a new `jsonb` column is covered the moment it exists.
 */
const columnsOfType = async (predicate) =>
  (
    await db
      .execute(sql`
        select table_name, column_name, data_type
          from information_schema.columns
         where table_schema = 'app'
         order by table_name, column_name
      `)
      .then((r) => r.rows)
  ).filter(predicate);

const htmlColumns = await columnsOfType(
  (c) => c.data_type === "text" && c.column_name.endsWith("_html"),
);
const jsonColumns = await columnsOfType((c) => c.data_type === "jsonb");

const classAttr = /class\s*=\s*"([^"]*)"/g;
const stray = new Map();

for (const { table_name: table, column_name: column } of htmlColumns) {
  const rows = await db
    .execute(sql`select id, ${sql.raw(`"${column}"`)} as value from ${sql.raw(`app."${table}"`)}`)
    .then((r) => r.rows);
  for (const row of rows)
    for (const match of String(row.value ?? "").matchAll(classAttr))
      for (const cls of match[1].split(/\s+/).filter(Boolean))
        if (!/^language-[\w-]+$/.test(cls)) stray.set(cls, `${table}.${column} ${row.id}`);
}

check(
  stray.size === 0,
  `no stored HTML carries a class the stylesheet would have to be told about (${htmlColumns.length} column(s))`,
  [...stray].map(([c, where]) => `${c} (${where})`).join(", "),
);

// --- 3. The JSONB columns that remain carry no `class` key ------------------
const keyed = new Map();
const walk = (value, where) => {
  if (Array.isArray(value)) return value.forEach((v) => walk(v, where));
  if (value && typeof value === "object")
    for (const [key, inner] of Object.entries(value))
      if (key === "class" && typeof inner === "string")
        inner.split(/\s+/).filter(Boolean).forEach((c) => keyed.set(c, where));
      else walk(inner, where);
};

for (const { table_name: table, column_name: column } of jsonColumns) {
  const rows = await db
    .execute(sql`select id, ${sql.raw(`"${column}"`)} as value from ${sql.raw(`app."${table}"`)}`)
    .then((r) => r.rows);
  for (const row of rows) walk(row.value, `${table}.${column} ${row.id}`);
}

check(
  keyed.size === 0,
  `no stored JSON carries a \`class\` key (${jsonColumns.length} column(s))`,
  [...keyed].map(([c, where]) => `${c} (${where})`).join(", "),
);

console.log(
  failures === 0
    ? "\nNothing in the database names a CSS class. app/globals.css needs no inline source list."
    : `\n${failures} check(s) FAILED. Something stored in the database names a class Tailwind cannot see — either fix the content or put an @source inline list back in app/globals.css.`,
);

await pool.end();
process.exit(failures === 0 ? 0 : 1);
