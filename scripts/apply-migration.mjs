/**
 * Run one migration file against the database, in a transaction.
 *
 * The SQL in `drizzle/` is hand-written, because a generator emits statements
 * that must never execute against this database -- `DISABLE ROW LEVEL SECURITY`
 * chief among them (see `drizzle/README.md`). Applying it by hand is the
 * intended workflow; this just makes it one command rather than a psql session,
 * and puts the whole file in one transaction so a failure half way leaves
 * nothing behind.
 *
 * Dry run by default: it prints the statements and rolls back, so you see
 * exactly what would run.
 *
 *   node scripts/apply-migration.mjs drizzle/0000_init.sql
 *   node scripts/apply-migration.mjs drizzle/0000_init.sql --apply
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
// any schema tool has to reach for this URL rather than the pooled one.
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

/*
 * A file that opens or closes its own transaction cannot be dry-run.
 *
 * Everything below runs inside one transaction that is rolled back unless
 * `--apply` is given, and a `commit` in the file ends that transaction from
 * the inside: whatever came before it is already durable, the final `rollback`
 * has nothing left to undo, and the run still prints "rolled back -- nothing
 * changed". A migration here did exactly this once, and its dry run committed.
 *
 * Refused rather than stripped. A file written around its own transaction may
 * be relying on it, and quietly removing the boundary would make this a
 * different migration from the one that was reviewed.
 *
 * **A PL/pgSQL body is not transaction control.** `DO $$ ... BEGIN ... END $$`
 * opens a *block*, not a transaction, and its `BEGIN` sits at the start of a
 * line like any other. Scanning the raw text refused every migration that
 * enables row-level security in a loop -- which is to say the baseline schema
 * and the drop that retires the old one, neither of which contains a single
 * transaction statement. Dollar-quoted bodies are blanked before the scan so
 * only the SQL between them is read.
 */
function withoutDollarQuoted(sql) {
  const delimiter = /\$([A-Za-z_]\w*)?\$/g;
  let out = "";
  let last = 0;
  let match;
  while ((match = delimiter.exec(sql))) {
    const tag = match[0];
    const close = sql.indexOf(tag, match.index + tag.length);
    if (close === -1) break; // unterminated; leave the rest as written
    out += sql.slice(last, match.index) + tag + tag;
    last = close + tag.length;
    delimiter.lastIndex = last;
  }
  return out + sql.slice(last);
}

const CONTROL = /^[ \t]*(begin|commit|rollback|start[ \t]+transaction|savepoint)\b/im;
for (const statement of statements) {
  const found = withoutDollarQuoted(statement).match(CONTROL);
  if (found) {
    console.error(
      `${file} contains its own transaction control (${found[1]}).\n` +
        "This script wraps the whole file in one transaction, so a dry run of it\n" +
        "would commit. Remove the transaction control and run it again.",
    );
    process.exit(1);
  }
}

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
