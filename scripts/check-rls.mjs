/**
 * Row Level Security is on, and the application is not locked out by it.
 *
 * `drizzle/0000_init.sql` enables it on every table it creates, but a SQL file
 * runs once where the risk is continuous: a table added by hand afterwards is
 * covered by nobody. This is what closes that gap -- it fails if a table ever
 * appears without RLS.
 *
 * Why it matters is worth restating, because RLS with no policies looks like a
 * mistake. Supabase puts a PostgREST API over the schemas it is configured to
 * expose, for anyone holding the project's anon key and independently of this
 * application; without RLS, `account` and `account_identity` are readable
 * straight through it. Zero policies is the intended state -- nothing outside
 * this application should read these tables at all -- and the app is unaffected
 * because its role has `rolbypassrls`.
 *
 * **Every schema this project owns is checked, not a list written down here.**
 * Whether a schema is exposed through PostgREST is a project setting somebody
 * can change in a dashboard, so the answer to "which schemas matter" is "all of
 * ours". Enumerating them also means a schema arriving or leaving needs no edit
 * to this file. Supabase's own schemas are excluded: they are managed by
 * Supabase and are not ours to hold to this rule.
 *
 * **This is also the check that catches a generated migration.** `drizzle-kit
 * generate` does not model RLS, reads every table as "should be disabled", and
 * emits `DISABLE ROW LEVEL SECURITY` for all of them. Running that output
 * unedited would open the whole schema, and nothing else in the repo would
 * notice.
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

  /*
   * Everything except Postgres's own catalogues and the schemas Supabase
   * manages. `information_schema` and `pg_*` are the server's; `auth`,
   * `storage`, `realtime`, `vault`, `extensions`, `graphql*`, `pgbouncer`,
   * `cron`, `net` and `supabase*` belong to the platform and carry their own
   * policies.
   */
  const { rows: owned } = await pool.query(
    `select nspname from pg_namespace
      where nspname not like 'pg\_%'
        and nspname not in ('information_schema', 'auth', 'storage', 'realtime', 'vault',
                            'extensions', 'graphql', 'graphql_public', 'pgbouncer', 'cron', 'net')
        and nspname not like 'supabase%'
        and exists (select 1 from pg_class c where c.relnamespace = pg_namespace.oid and c.relkind = 'r')
      order by nspname`,
  );
  check("found the schemas this project owns", owned.length > 0,
    owned.map((row) => row.nspname).join(", "));

  for (const { nspname: schema } of owned) {
    const { rows: off } = await pool.query(
      `select c.relname
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = $1 and c.relkind = 'r' and not c.relrowsecurity
       order by 1`,
      [schema],
    );
    const { rows: counted } = await pool.query(
      `select count(*)::int n
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = $1 and c.relkind = 'r'`,
      [schema],
    );

    check(
      `every table in the ${schema} schema has RLS enabled`,
      off.length === 0 && counted[0].n > 0,
      off.length === 0
        ? `${counted[0].n} tables`
        : `${off.length} without it: ${off.map((row) => row.relname).join(", ")}`,
    );
  }

  /*
   * Zero is the intended number. A policy here would mean something outside
   * this application had been granted a way in, which is the opposite of what
   * the RLS is for -- so this reports rather than assumes.
   */
  const { rows: policies } = await pool.query(
    "select schemaname, tablename, policyname from pg_policies where schemaname = any($1)",
    [owned.map((row) => row.nspname)],
  );
  check(
    "and no policy grants anything through it",
    policies.length === 0,
    policies.map((row) => `${row.schemaname}.${row.tablename}.${row.policyname}`).join(", ") ||
      "no policies",
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
