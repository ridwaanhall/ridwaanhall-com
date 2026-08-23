/** Connectivity + inventory check against whichever database .env.local points at. */
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local", quiet: true });

const t0 = Date.now();
/**
 * A minimal tagged-template shim over `pg`, so these scripts read the same way
 * the app's Drizzle queries do. `pg` rather than `postgres.js` for the reason
 * given in lib/db/client.ts: postgres.js pipelines onto one socket and stalls
 * permanently under Supabase's transaction pooler.
 */
const url = new URL(process.env.STORAGE_POSTGRES_URL);
url.searchParams.delete("sslmode");
const pool = new pg.Pool({ connectionString: url.toString(), max: 5, ssl: { rejectUnauthorized: false } });
const sql = Object.assign(
  (strings, ...values) =>
    pool
      .query(strings.reduce((q, part, i) => q + part + (i < values.length ? `$${i + 1}` : ""), ""), values)
      .then((r) => r.rows),
  { end: () => pool.end() },
);

/*
 * `n_live_tup` is the planner's estimate, not a count -- it is what the
 * statistics collector last saw, so it can lag a burst of writes. That is the
 * right trade for an inventory: `count(*)` over 45 tables is 45 sequential
 * scans, and nothing here needs a number that exact.
 */
const rows = await sql`
  select relname as table_name, n_live_tup as row_count
  from pg_stat_user_tables
  where schemaname = 'app' and n_live_tup > 0
  order by relname`;
console.log(`connected + queried in ${Date.now() - t0}ms\n`);
for (const r of rows) console.log(String(r.row_count).padStart(6), r.table_name);

const [rls] = await sql`
  select
    count(*) filter (where rowsecurity)     as rls_on,
    count(*) filter (where not rowsecurity) as rls_off
  from pg_tables where schemaname = 'app'`;
console.log("\nRLS:", rls);

await sql.end();
