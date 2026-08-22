/**
 * Write `lib/db/app-schema.ts` from what is actually in the `app` schema.
 *
 * `drizzle-kit pull` reads `public` and nothing else here -- pointed at a
 * `schemaFilter` of `["app"]` it fetches zero tables -- so the mapping is
 * generated from `information_schema` instead. Generated rather than typed by
 * hand because 45 tables of column names is exactly the kind of transcription
 * that goes wrong silently: a mistyped SQL name in a Drizzle definition is a
 * column the app writes to and never reads back, with no error anywhere.
 *
 * Re-run it after any migration that changes `app`.
 *
 *   node scripts/gen-app-schema.mjs
 */
import { writeFileSync } from "node:fs";

import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local", quiet: true });

const url = new URL(process.env.STORAGE_POSTGRES_URL_NON_POOLING ?? process.env.STORAGE_POSTGRES_URL);
url.searchParams.delete("sslmode");
const pool = new pg.Pool({ connectionString: url.toString(), max: 5, ssl: { rejectUnauthorized: false } });
const q = (text, params = []) => pool.query(text, params).then((r) => r.rows);

const camel = (s) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());

/** Postgres type -> the Drizzle builder that reads and writes it faithfully. */
function builder(column) {
  switch (column.data_type) {
    case "uuid": return "uuid";
    case "text": return "text";
    case "boolean": return "boolean";
    case "integer": return "integer";
    case "jsonb": return "jsonb";
    case "date": return "date";
    case "timestamp with time zone": return "timestamp";
    default: throw new Error(`no builder for ${column.table_name}.${column.column_name}: ${column.data_type}`);
  }
}

const tables = await q(`
  select table_name from information_schema.tables
  where table_schema = 'app' and table_type = 'BASE TABLE' order by table_name`);

const columns = await q(`
  select table_name, column_name, data_type, is_nullable, column_default
  from information_schema.columns where table_schema = 'app'
  order by table_name, ordinal_position`);

const pks = await q(`
  select c.relname as table_name, a.attname as column_name
  from pg_index i
  join pg_class c on c.oid = i.indrelid
  join pg_namespace n on n.oid = c.relnamespace
  join pg_attribute a on a.attrelid = c.oid and a.attnum = any(i.indkey)
  where n.nspname = 'app' and i.indisprimary`);

const fks = await q(`
  select con.conrelid::regclass::text as child,
         a.attname as column_name,
         con.confrelid::regclass::text as parent,
         pa.attname as parent_column
  from pg_constraint con
  join pg_attribute a on a.attrelid = con.conrelid and a.attnum = con.conkey[1]
  join pg_attribute pa on pa.attrelid = con.confrelid and pa.attnum = con.confkey[1]
  where con.contype = 'f' and con.connamespace = 'app'::regnamespace`);

const pkOf = new Map();
for (const r of pks) pkOf.set(`${r.table_name}.${r.column_name}`, true);
const pkCount = new Map();
for (const r of pks) pkCount.set(r.table_name, (pkCount.get(r.table_name) ?? 0) + 1);

const fkOf = new Map();
for (const r of fks) fkOf.set(`${r.child.replace(/^app\./, "")}.${r.column_name}`, r.parent.replace(/^app\./, ""));

const used = new Set();
const body = [];

for (const { table_name: table } of tables) {
  const cols = columns.filter((c) => c.table_name === table);
  const composite = (pkCount.get(table) ?? 0) > 1;
  const lines = [];

  for (const c of cols) {
    const build = builder(c);
    used.add(build);
    const prop = camel(c.column_name);
    const arg = prop === c.column_name ? "" : `"${c.column_name}"`;
    const parts = [];

    if (build === "timestamp") {
      parts.push(`timestamp(${arg ? `${arg}, ` : ""}{ withTimezone: true, mode: "string" })`);
    } else if (build === "date") {
      parts.push(`date(${arg})`);
    } else {
      parts.push(`${build}(${arg})`);
    }

    // A uuid primary key defaulting to gen_random_uuid() is `.defaultRandom()`,
    // which is what lets an insert omit it.
    if (!composite && pkOf.has(`${table}.${c.column_name}`)) {
      parts.push("primaryKey()");
      if (/gen_random_uuid/.test(c.column_default ?? "")) parts.push("defaultRandom()");
    } else {
      const parent = fkOf.get(`${table}.${c.column_name}`);
      if (parent) parts.push(`references((): AnyPgColumn => ${camel(parent)}.id)`);
      if (c.is_nullable === "NO") parts.push("notNull()");
      if (c.column_default != null && !/gen_random_uuid|nextval/.test(c.column_default)) {
        const d = String(c.column_default);
        if (/^'(.*)'::(text|character varying)$/.test(d)) parts.push(`default(${d.replace(/::.*$/, "")})`);
        else if (/^(true|false)$/.test(d)) parts.push(`default(${d})`);
        else if (/^\d+$/.test(d)) parts.push(`default(${d})`);
        else if (/^'(\[\]|\{\})'::jsonb$/.test(d)) parts.push(`default(${d.includes("[]") ? "[]" : "{}"})`);
        else if (/^now\(\)$/.test(d)) parts.push("defaultNow()");
      }
    }

    lines.push(`  ${prop}: ${parts.join(".")},`);
  }

  const extra = composite
    ? `, (t) => [primaryKey({ columns: [${pks.filter((p) => p.table_name === table).map((p) => `t.${camel(p.column_name)}`).join(", ")}] })]`
    : "";
  if (composite) used.add("primaryKey");

  body.push(`export const ${camel(table)} = app.table("${table}", {\n${lines.join("\n")}\n}${extra});`);
}

const imports = [...used].filter((u) => u !== "primaryKey").sort();
if (used.has("primaryKey")) imports.push("primaryKey");

const header = `import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { pgSchema, ${imports.join(", ")} } from "drizzle-orm/pg-core";

/**
 * The application's own schema, as Drizzle sees it.
 *
 * GENERATED by scripts/gen-app-schema.mjs from the live \`app\` schema -- do not
 * edit by hand, re-run it. 45 tables of column names is exactly the kind of
 * transcription that fails silently: a mistyped SQL name is a column the app
 * writes to and never reads back, with no error anywhere.
 *
 * \`lib/db/schema.ts\` beside this file is the \`public\` schema Django built. It
 * stays until the deploy, and nothing new should be written against it.
 */
export const app = pgSchema("app");

`;

writeFileSync("lib/db/app-schema.ts", header + body.join("\n\n") + "\n");
console.log(`lib/db/app-schema.ts: ${tables.length} tables, ${columns.length} columns, ${fks.length} foreign keys`);
await pool.end();
