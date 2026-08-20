/** Connectivity + inventory check against whichever database .env.local points at. */
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });

const t0 = Date.now();
const sql = postgres(process.env.STORAGE_POSTGRES_URL, {
  prepare: false,
  max: 1,
  ssl: "require",
});

const rows = await sql`
  select relname as table_name, n_live_tup as row_count
  from pg_stat_user_tables
  where schemaname = 'public' and n_live_tup > 0
  order by relname`;
console.log(`connected + queried in ${Date.now() - t0}ms\n`);
for (const r of rows) console.log(String(r.row_count).padStart(6), r.table_name);

const [rls] = await sql`
  select
    count(*) filter (where rowsecurity)     as rls_on,
    count(*) filter (where not rowsecurity) as rls_off
  from pg_tables where schemaname = 'public'`;
console.log("\nRLS:", rls);

await sql.end();
