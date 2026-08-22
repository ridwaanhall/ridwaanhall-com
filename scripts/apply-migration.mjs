/**
 * Run one migration file against the database, in a transaction.
 *
 * `drizzle-kit migrate` has never run here and should not start: every
 * migration in `drizzle/` after the introspection baseline is hand-written,
 * because generate emits statements that must never execute against this
 * database (see `drizzle/README.md`). Applying them by hand is the intended
 * workflow -- this just makes it one command rather than a psql session, and
 * puts the whole file in one transaction so a failure half way leaves nothing
 * behind.
 *
 * Dry run by default, like `blocks-to-html.mjs` was: it prints the statements
 * and rolls back, so you see exactly what would run.
 *
 *   node scripts/apply-migration.mjs drizzle/0003_drop_django_leftovers.sql
 *   node scripts/apply-migration.mjs drizzle/0003_drop_django_leftovers.sql --apply
 */
import { readFileSync } from "node:fs";

import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local", quiet: true });

const file = process.argv[2];
const APPLY = process.argv.includes("--apply");
if (!file) {
  console.error("usage: node scripts/apply-migration.mjs <file.sql> [--apply]");
  process.exit(1);
}

// DDL goes over the direct connection. Neither DDL nor introspection is
// reliable behind pgbouncer's transaction-mode pooling -- the same reason
// drizzle.config.ts and Django's `migrate` both reach for this URL.
const raw = process.env.STORAGE_POSTGRES_URL_NON_POOLING;
if (!raw) {
  console.error("STORAGE_POSTGRES_URL_NON_POOLING is not set (see .env.example)");
  process.exit(1);
}
const url = new URL(raw);
// `pg` reads sslmode=require as verify-full, which Supabase's certificate does
// not satisfy. TLS is configured here instead, as it is in lib/db/client.ts.
url.searchParams.delete("sslmode");

const statements = readFileSync(file, "utf8")
  .split("--> statement-breakpoint")
  .map((part) =>
    part
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("--"))
      .join("\n")
      .trim(),
  )
  .filter(Boolean);

console.log(`${file}: ${statements.length} statement(s)${APPLY ? "" : "  (dry run -- pass --apply to keep it)"}\n`);

const client = new pg.Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
await client.connect();

try {
  await client.query("begin");
  for (const statement of statements) {
    console.log(`  ${statement.replace(/\s+/g, " ").slice(0, 100)}`);
    await client.query(statement);
  }
  // Deferred constraints are only checked at commit, so a dry run that just
  // rolled back would not notice one being violated. Force it either way.
  await client.query("set constraints all immediate");
  await client.query(APPLY ? "commit" : "rollback");
  console.log(APPLY ? "\ncommitted." : "\nrolled back -- nothing changed.");
} catch (error) {
  await client.query("rollback").catch(() => {});
  console.error(`\nFAILED, rolled back: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
