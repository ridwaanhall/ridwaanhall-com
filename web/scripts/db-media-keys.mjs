import { config } from "dotenv";
import pg from "pg";
config({ path: ".env.local", quiet: true });
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
const keys = new Set();
for (const t of [
  sql`select image as k from blog_blogimage`,
  sql`select image as k from projects_projectimage`,
  sql`select logo as k from about_organization where logo <> ''`,
  sql`select image as k from about_profile where image <> ''`,
  sql`select author_image as k from blog_blogpost where author_image <> ''`,
]) for (const { k } of await t) if (k) keys.add(k);
const special = [...keys].filter((k) => /[^A-Za-z0-9_.~\-\/]/.test(k));
console.log(`${keys.size} distinct keys; ${special.length} contain characters that need percent-encoding`);
special.slice(0, 15).forEach((k) => console.log("  ", JSON.stringify(k)));
console.log("\nsample:", [...keys].slice(0, 3));
await sql.end();
