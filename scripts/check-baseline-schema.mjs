/**
 * `drizzle/0000_init.sql`, run against an empty database, produces the schema
 * the application actually talks to.
 *
 * That claim is the whole of the setup instructions in the README, and nothing
 * else checks it. `scripts/check-app-schema.mjs` proves the *Drizzle mapping*
 * matches the live `app` schema; it says nothing about whether the SQL file a
 * new installation runs would build that schema in the first place. Those drift
 * apart the moment a column is added by hand -- the mapping is regenerated from
 * the database and agrees again, while the baseline quietly describes something
 * nobody has run in months.
 *
 * So this runs it. The file is applied into a scratch schema inside one
 * transaction, compared against `app` column by column and constraint by
 * constraint, and rolled back.
 *
 *   npx tsx scripts/check-baseline-schema.mjs
 *
 * Nothing is left behind: the scratch schema only ever exists inside a
 * transaction that ends in `rollback`. `set constraints all immediate` runs
 * first so a deferred violation cannot escape by being rolled back before
 * anyone checked it.
 */
import { readFileSync } from "node:fs";

import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local", quiet: true });

const FILE = "drizzle/0000_init.sql";
const SCRATCH = "zz_baseline_check";

const raw = process.env.STORAGE_POSTGRES_URL_NON_POOLING;
if (!raw) {
  console.error("STORAGE_POSTGRES_URL_NON_POOLING is not set (see .env.example)");
  process.exit(1);
}
const url = new URL(raw);
url.searchParams.delete("sslmode");

let failures = 0;
const check = (ok, label, detail = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}${ok || !detail ? "" : `  ${detail}`}`);
};

/*
 * The file names its own schema throughout -- `"app"."table"` in the DDL and a
 * bare `app` in the string the RLS loop compares `schemaname` against. Both
 * have to point at the scratch schema, or the check would either collide with
 * the live tables or silently assert against them.
 */
function intoScratch(sql) {
  return sql
    .replaceAll('"app"', `"${SCRATCH}"`)
    .replaceAll("app.%I", `${SCRATCH}.%I`)
    .replaceAll("'app'", `'${SCRATCH}'`);
}

const statements = intoScratch(readFileSync(FILE, "utf8"))
  .split("--> statement-breakpoint")
  .map((part) =>
    part
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("--"))
      .join("\n")
      .trim(),
  )
  .filter(Boolean);

const client = new pg.Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
await client.connect();
const q = (text, params = []) => client.query(text, params).then((r) => r.rows);

/** Every shape question asked once, of whichever schema is passed in. */
const SHAPE = {
  columns: `
    select table_name || '.' || column_name || ' ' || data_type
           || case when is_nullable = 'YES' then ' null' else ' not null' end
           || coalesce(' default ' || column_default, '') as x
      from information_schema.columns where table_schema = $1`,
  primaryKeys: `
    select c.relname || '(' || string_agg(a.attname, ',' order by a.attname) || ')' as x
      from pg_index i
      join pg_class c on c.oid = i.indrelid
      join pg_namespace n on n.oid = c.relnamespace
      join pg_attribute a on a.attrelid = c.oid and a.attnum = any(i.indkey)
     where n.nspname = $1 and i.indisprimary group by c.relname, i.indexrelid`,
  foreignKeys: `
    select cl.relname || '.' || a.attname || ' -> ' || fc.relname
           || ' on delete ' || (case con.confdeltype
                when 'a' then 'no action' when 'r' then 'restrict' when 'c' then 'cascade'
                when 'n' then 'set null'  when 'd' then 'set default' else '?' end)
           || ' deferrable ' || con.condeferrable::text as x
      from pg_constraint con
      join pg_class cl on cl.oid = con.conrelid
      join pg_namespace cn on cn.oid = cl.relnamespace
      join pg_class fc on fc.oid = con.confrelid
      join pg_attribute a on a.attrelid = cl.oid and a.attnum = con.conkey[1]
     where con.contype = 'f' and cn.nspname = $1`,
  checks: `
    select cl.relname || ': ' || pg_get_constraintdef(con.oid) as x
      from pg_constraint con
      join pg_class cl on cl.oid = con.conrelid
      join pg_namespace cn on cn.oid = cl.relnamespace
     where con.contype = 'c' and cn.nspname = $1`,
  indexes: `
    select replace(indexdef, indexname, 'I') as x
      from pg_indexes where schemaname = $1`,
  rls: `
    select c.relname as x from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = $1 and c.relkind = 'r' and c.relrowsecurity`,
  tables: `
    select tablename as x from pg_tables where schemaname = $1`,
};

/*
 * The schema's own name is spelled out inside defaults, check expressions and
 * index definitions, so it has to come out before the two sides can be compared
 * -- otherwise every such row differs by exactly the thing under test.
 */
const shapeOf = async (schema) => {
  const out = {};
  for (const [name, sql] of Object.entries(SHAPE)) {
    out[name] = (await q(sql, [schema]))
      .map((r) => String(r.x).replaceAll(`"${schema}".`, "S.").replaceAll(`${schema}.`, "S."))
      .sort();
  }
  return out;
};

console.log(`${FILE}: ${statements.length} statement(s), applied into "${SCRATCH}" and rolled back\n`);

try {
  await q("begin");
  try {
    for (const statement of statements) await q(statement);

    // Deferred constraints are only checked at commit; force them now, because
    // this transaction never reaches one.
    await q("set constraints all immediate");

    const built = await shapeOf(SCRATCH);
    const live = await shapeOf("app");

    check(built.tables.length > 0, `the baseline builds tables`, `${built.tables.length}`);

    for (const aspect of Object.keys(SHAPE)) {
      const missing = live[aspect].filter((x) => !built[aspect].includes(x));
      const extra = built[aspect].filter((x) => !live[aspect].includes(x));
      const detail = [
        missing.length ? `missing ${missing.length}: ${missing.slice(0, 3).join(" | ")}` : "",
        extra.length ? `extra ${extra.length}: ${extra.slice(0, 3).join(" | ")}` : "",
      ]
        .filter(Boolean)
        .join("  //  ");
      check(!missing.length && !extra.length, `${aspect} match app (${live[aspect].length})`, detail);
    }

    const noRls = built.tables.filter((t) => !built.rls.includes(t));
    check(noRls.length === 0, "every table the baseline creates has RLS enabled", noRls.join(", "));
  } finally {
    await q("rollback");
  }

  const [{ gone }] = await q(
    `select count(*)::int = 0 as gone from information_schema.schemata where schema_name = $1`,
    [SCRATCH],
  );
  check(gone, "the scratch schema was rolled back, not left behind");
} catch (error) {
  failures++;
  console.log(`  FAIL  ${error.message.split("\n")[0]}`);
} finally {
  await client.end();
}

console.log(
  failures === 0
    ? `\n${FILE} reproduces the app schema exactly.`
    : `\n${failures} check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
