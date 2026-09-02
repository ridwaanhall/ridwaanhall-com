/**
 * Every foreign key into a lookup table is counted by that table's screen.
 *
 * A "Used by" column is a transcription of the schema, and a transcription of
 * the schema is the thing that goes quietly out of date. The organizations
 * screen counted four of its five relations for however long it took somebody
 * to read the descriptor and the catalogue side by side: an organization named
 * by three job applications rendered as `unused`, while `lib/admin/blockers.ts`
 * -- which reads `pg_constraint` rather than a list -- refused the delete and
 * named them. Two answers to one question, and the wrong one was the one on
 * screen before anybody pressed anything.
 *
 * So the same question is asked of the catalogue here. `ADMIN_USAGE` in
 * `lib/admin/models/index.ts` declares what each screen counts; this asks
 * Postgres what actually points at those tables and fails on the difference.
 *
 * **The `confdeltype` filter that `blockers.ts` applies is wrong here**, and
 * deliberately absent. That module answers "what would refuse this delete", so
 * it looks only at `RESTRICT` and `NO ACTION`. This one answers "what uses this
 * record", which is a different question with a wider answer: every one of the
 * six foreign keys into `location` is `SET NULL` and both into `skill` are
 * `CASCADE`, so filtering the way `blockers.ts` does would report those two
 * screens as having nothing to count and pass while saying nothing.
 *
 * Read-only: it writes nothing and needs no cleanup.
 *
 *   npx tsx scripts/check-admin-usage.mjs
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const { ADMIN_FORM_MODELS, ADMIN_LIST_MODELS, ADMIN_USAGE } = await import(
  "../lib/admin/models/index.ts"
);
const { ADMIN_ENTRIES_BY_KEY } = await import("../lib/admin/registry.ts");
const { db, pool } = await import("../lib/db/client.ts");
const { sql } = await import("drizzle-orm");
const { getTableName } = await import("drizzle-orm");

let failures = 0;
const check = (ok, label, detail = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}${ok || !detail ? "" : `  ${detail}`}`);
};

/**
 * Every single-column foreign key pointing at one table in `app`.
 *
 * `conkey[1]` with `array_length(conkey, 1) = 1` rather than unnesting: a
 * composite foreign key is not something a scalar count can express, and none
 * exists here. One appearing would show up as a table this reports nothing for,
 * which is the safe direction to be wrong in.
 */
async function referringColumns(table) {
  const result = await db.execute(sql`
    select src.relname as src_table, att.attname as src_column
    from pg_constraint con
    join pg_class src on src.oid = con.conrelid
    join pg_class tgt on tgt.oid = con.confrelid
    join pg_namespace tgt_ns on tgt_ns.oid = tgt.relnamespace
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = con.conkey[1]
    where con.contype = 'f'
      and array_length(con.conkey, 1) = 1
      and tgt_ns.nspname = 'app'
      and tgt.relname = ${table}
    order by src.relname, att.attname
  `);
  return result.rows.map((row) => `${row.src_table}.${row.src_column}`);
}

const keys = Object.keys(ADMIN_USAGE).sort();
console.log(`Checking ${keys.length} screens with a "Used by" column.\n`);

let totalRelations = 0;

for (const key of keys) {
  const { table, columns } = ADMIN_USAGE[key];
  const tableName = getTableName(table);

  // The screen has to exist. A usage entry naming no registry key is a column
  // nobody can reach, and the map is hand-written where the registry is not.
  check(ADMIN_ENTRIES_BY_KEY.has(key), `${key}: is a registry screen`);

  const declared = columns
    .map((column) => `${getTableName(column.table)}.${column.name}`)
    .sort();
  const actual = await referringColumns(tableName);
  totalRelations += actual.length;

  const missing = actual.filter((name) => !declared.includes(name));
  const stale = declared.filter((name) => !actual.includes(name));

  check(
    missing.length === 0,
    `${key}: counts every foreign key into ${tableName} (${actual.length})`,
    missing.length === 0 ? "" : `not counted: ${missing.join(", ")}`,
  );
  check(
    stale.length === 0,
    `${key}: counts nothing that is not a foreign key into ${tableName}`,
    stale.length === 0 ? "" : `no such constraint: ${stale.join(", ")}`,
  );
}

/*
 * The other direction: the map and the screen agree.
 *
 * Everything above proves `ADMIN_USAGE` against the catalogue. This proves it
 * against the descriptor -- an entry with no column behind it is a declaration
 * nobody sees, and a column with no entry is one nothing checks, which is the
 * state the organizations screen was in.
 */
for (const key of keys) {
  const list = ADMIN_LIST_MODELS[key];
  const shown = list?.columns.some((column) => column.key === "used" || column.key === "used_by");
  check(shown === true, `${key}: the list actually renders the column`);
}

/*
 * And a note, not a failure, for tables that look like they want one.
 *
 * Whether a record is *shared* or merely *owned* is a judgement: a project's
 * images and tags are its own and appear as inlines on its form, while an
 * organization's certifications belong to somebody else. No query can tell
 * those apart, so this reports and leaves it -- exactly what
 * `scripts/audit-storage.mjs` does with an object it cannot find a row for.
 */
const covered = new Set(Object.values(ADMIN_USAGE).map(({ table }) => getTableName(table)));
const notes = [];
for (const [key, model] of Object.entries(ADMIN_FORM_MODELS)) {
  const tableName = getTableName(model.from);
  if (covered.has(tableName)) continue;
  const owned = new Set((model.inlines ?? []).map((inline) => getTableName(inline.table)));
  const referring = (await referringColumns(tableName)).filter(
    (name) => !owned.has(name.split(".")[0]),
  );
  if (referring.length > 0) notes.push(`  note  ${key}: ${referring.join(", ")}`);
}

if (notes.length > 0) {
  console.log('\nReferenced from outside their own form, with no "Used by" column:');
  for (const note of notes) console.log(note);
}

console.log(
  failures === 0
    ? `\nAll ${totalRelations} foreign keys into a lookup table are counted by its screen.`
    : `\n${failures} check(s) FAILED. A "Used by" column disagrees with the schema — update ADMIN_USAGE and the descriptor's cell together.`,
);

await pool.end();
process.exit(failures === 0 ? 0 : 1);
