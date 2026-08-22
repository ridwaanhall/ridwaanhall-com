/**
 * Row Level Security is on, and the application is not locked out by it.
 *
 * Django force-enabled RLS on every public table from a `post_migrate`
 * receiver, so a table added by a later migration was covered without anyone
 * remembering. That receiver goes with the Django tree at cutover, and
 * `drizzle/0002_enable_row_level_security.sql` replaces it -- but a SQL file
 * runs once, where the receiver ran after every schema change. This is what
 * closes that gap: it fails if a public table ever appears without RLS.
 *
 * Why it matters is worth restating, because RLS with no policies looks like a
 * mistake. Supabase puts a PostgREST API over the `public` schema for anyone
 * holding the project's anon key, independently of this application; without
 * RLS, `auth_user` and `socialaccount_socialtoken` are readable straight
 * through it. Zero policies is the intended state -- nothing outside this
 * application should read these tables at all -- and the app is unaffected
 * because its role has `rolbypassrls`.
 *
 * **This is also the check that catches a generated migration.**
 * `drizzle-kit generate` does not model RLS, reads every table as "should be
 * disabled", and emits `DISABLE ROW LEVEL SECURITY` for all of them. Running
 * that output unedited would open the whole schema, and nothing else in the
 * repo would notice.
 *
 *   npx tsx scripts/check-rls.mjs
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const { pool } = await import("../lib/db/client.ts");

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push({ name, pass });
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

try {
  const { rows: roles } = await pool.query(
    "select rolname, rolsuper, rolbypassrls from pg_roles where rolname = current_user",
  );
  const role = roles[0];

  check(
    "the application's role bypasses RLS, so enabling it costs the app nothing",
    role?.rolbypassrls === true,
    `${role?.rolname} (bypassrls ${role?.rolbypassrls})`,
  );

  const { rows: off } = await pool.query(`
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
    order by 1
  `);
  const { rows: counted } = await pool.query(`
    select count(*)::int n
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  `);

  check(
    "every table in the public schema has RLS enabled",
    off.length === 0,
    off.length === 0
      ? `${counted[0].n} tables`
      : `${off.length} without it: ${off.map((row) => row.relname).join(", ")}`,
  );

  /*
   * Zero is the intended number. A policy here would mean something outside
   * this application had been granted a way in, which is the opposite of what
   * the RLS is for -- so this reports rather than assumes.
   */
  const { rows: policies } = await pool.query(
    "select schemaname, tablename, policyname from pg_policies where schemaname = 'public'",
  );
  check(
    "and no policy grants anything through it",
    policies.length === 0,
    policies.map((row) => `${row.tablename}.${row.policyname}`).join(", ") || "no policies",
  );
} finally {
  await pool.end();
}

const failed = checks.filter((entry) => !entry.pass);
console.log(
  failed.length === 0
    ? `\nAll ${checks.length} RLS checks passed.`
    : `\n${failed.length} of ${checks.length} checks FAILED.`,
);
process.exit(failed.length === 0 ? 0 : 1);
