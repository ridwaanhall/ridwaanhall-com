/**
 * The generated Drizzle mapping matches the schema it was generated from.
 *
 * `lib/db/app-schema.ts` is written by `scripts/gen-app-schema.mjs`, and the
 * failure it exists to catch is silent: a column whose SQL name is wrong in the
 * mapping is a column the application writes to and never reads back. Neither
 * `tsc` nor a build can see it -- Drizzle happily emits `select "storagekey"`
 * and Postgres is the only thing that objects, at runtime, on the one code path
 * that touches it.
 *
 * So this selects every column of every table through Drizzle. An empty table
 * still proves the mapping: the statement has to name each column, and Postgres
 * rejects a name that is not there whether or not a row comes back.
 *
 * Read-only.
 *
 *   npx tsx scripts/check-app-schema.mjs
 */
import { config } from "dotenv";
import { reporter } from "./harness.mjs";

config({ path: ".env.local", quiet: true });

const schema = await import("../lib/db/app-schema.ts");
const { db, pool } = await import("../lib/db/client.ts");
const { getTableColumns, sql } = await import("drizzle-orm");

const { check, finish } = reporter({ detailOnFailure: true });

const tables = Object.entries(schema).filter(
  ([name, value]) => name !== "app" && value && typeof value === "object" && !!getTableColumns?.(value),
);

let columnCount = 0;
const broken = [];
for (const [name, table] of tables) {
  try {
    const columns = getTableColumns(table);
    columnCount += Object.keys(columns).length;
    await db.select().from(table).limit(1);
  } catch (error) {
    broken.push(`${name}: ${error.message.split("\n")[0]}`);
  }
}
check(
  `every column of all ${tables.length} tables selects (${columnCount} columns)`,
  broken.length === 0,
  broken.join("; "),
);

// The mapping must not have drifted from the database since it was generated.
const live = await db.execute(sql`
  select table_name, count(*)::int as n
  from information_schema.columns where table_schema = 'app'
  group by 1`).then((r) => r.rows);
const liveTotal = live.reduce((sum, r) => sum + r.n, 0);
check(
  "and the mapping covers exactly what the schema holds",
  liveTotal === columnCount,
  `${columnCount} mapped vs ${liveTotal} live -- re-run scripts/gen-app-schema.mjs`,
);

check(
  `no table is missing from the mapping`,
  live.length === tables.length,
  `${tables.length} mapped vs ${live.length} live`,
);

const exitCode = finish("The mapping agrees with the database.");

await pool.end();
process.exit(exitCode);
