/**
 * Back the database up to a file, or restore it from one -- the same code the
 * admin's Backup screen runs (`lib/backup/core.ts`), for the case the admin
 * cannot serve: a brand-new database, which has no staff account to sign in
 * with, or a backup too large to upload through a server action.
 *
 *   npx tsx scripts/backup.mjs export [file]           # default: a dated name here
 *   npx tsx scripts/backup.mjs restore <file>          # dry run: proves it, changes nothing
 *   npx tsx scripts/backup.mjs restore <file> --apply  # replaces every row
 *
 * Moving to a new database: apply `drizzle/0000_init.sql` to it, point
 * `STORAGE_POSTGRES_URL_NON_POOLING` (or `BACKUP_DATABASE_URL`, which wins) at
 * it, and restore. A restore replaces every row of every `app` table in one
 * transaction, so it all lands or none of it does.
 *
 * `*.backup.json` is gitignored: the file holds every account's email.
 */
import { readFileSync, writeFileSync } from "node:fs";

import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local", quiet: true });

const { backupFileName, exportBackup, restoreBackup } = await import("../lib/backup/core.ts");

const [command, file] = process.argv.slice(2);
const APPLY = process.argv.includes("--apply");
if (!["export", "restore"].includes(command) || (command === "restore" && !file)) {
  console.error("usage: npx tsx scripts/backup.mjs export [file] | restore <file> [--apply]");
  process.exit(1);
}

const raw = process.env.BACKUP_DATABASE_URL ?? process.env.STORAGE_POSTGRES_URL_NON_POOLING ?? process.env.STORAGE_POSTGRES_URL;
if (!raw) {
  console.error("No database URL: set BACKUP_DATABASE_URL or STORAGE_POSTGRES_URL_NON_POOLING.");
  process.exit(1);
}
const url = new URL(raw);
// TLS as `lib/db/client.ts` sets it, unless the URL says `sslmode=disable` --
// a database with no TLS at all, such as a local one restored into to test.
const ssl = url.searchParams.get("sslmode") === "disable" ? false : { rejectUnauthorized: false };
url.searchParams.delete("sslmode");
const client = new pg.Client({ connectionString: url.toString(), ssl });
await client.connect();
console.log(`Database: ${url.host}${url.pathname}`);

try {
  if (command === "export") {
    const backup = await exportBackup(client);
    const out = file ?? backupFileName();
    writeFileSync(out, JSON.stringify(backup));
    const rows = Object.values(backup.tables).reduce((sum, list) => sum + list.length, 0);
    console.log(`Wrote ${out}: ${rows} rows across ${Object.keys(backup.tables).length} tables.`);
  } else {
    const result = await restoreBackup(client, JSON.parse(readFileSync(file, "utf8")), { dryRun: !APPLY });
    if (!result.ok) {
      console.error(`Refused, nothing changed: ${result.error}`);
      process.exitCode = 1;
    } else {
      for (const [table, n] of Object.entries(result.restored)) if (n > 0) console.log(`  ${String(n).padStart(6)}  ${table}`);
      const rows = Object.values(result.restored).reduce((sum, n) => sum + n, 0);
      console.log(
        result.applied
          ? `Restored ${rows} rows. Expire the site's cache by redeploying, or by saving any record in the admin.`
          : `Dry run: ${rows} rows would be restored, and every statement succeeded. Nothing changed; pass --apply to do it.`,
      );
    }
  }
} finally {
  await client.end();
}
