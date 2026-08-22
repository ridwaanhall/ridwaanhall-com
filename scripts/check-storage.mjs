/**
 * Uploads, deletes, and the reference counting between them -- against the real
 * Supabase bucket and the real database.
 *
 * **The check that matters is that a shared file survives.** In the live data
 * `profile/ridwaanhall_20250913_2.webp` is named by twenty-one rows and
 * `logo/al_mukmin_ngruki.webp` by three, so deleting a file because *one*
 * referring row went away would break the images on all the others. Nothing here
 * goes near those rows: it creates two throwaway organizations, gives them the
 * same bytes -- which is the same key, since the key carries a digest of the
 * content -- and removes them one at a time, so the shared case is exercised on
 * rows this script owns.
 *
 * It also checks that the list of columns holding storage keys is complete, by
 * looking for key-shaped values in every text column of the public schema. A
 * column added without being listed in `FILE_COLUMNS` would leak its files
 * silently, and nothing else in the repo would notice.
 *
 * Everything created here is removed in a `finally`, and the last checks
 * re-count the table and re-probe the bucket to prove it.
 *
 *   npx tsx --conditions=react-server scripts/check-storage.mjs
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const { db, pool } = await import("../lib/db/client.ts");
const { aboutOrganization } = await import("../lib/db/schema.ts");
const { eq, like, inArray } = await import("drizzle-orm");
const { deleteObject, objectExists, putObject, storageConfigured } = await import(
  "../lib/storage/objects.ts"
);
const { deleteUnreferenced, isReferenced, FILE_COLUMNS } = await import(
  "../lib/storage/cleanup.ts"
);
const { objectKeyFor } = await import("../lib/storage/keys.ts");

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push({ name, pass });
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

if (!storageConfigured()) {
  console.log("Supabase Storage is not configured — nothing to check.");
  process.exit(0);
}

/** A 1x1 PNG, and a 1x1 GIF, so two distinct keys can be produced on demand. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

const MARK = `zz-storage-check-${Date.now()}`;
const madeRows = [];
const madeKeys = new Set();

try {
  // --- naming ----------------------------------------------------------------
  const first = objectKeyFor("logo", `${MARK}.png`, new Uint8Array(PNG));
  const again = objectKeyFor("logo", `${MARK}.png`, new Uint8Array(PNG));
  const other = objectKeyFor("logo", `${MARK}.gif`, new Uint8Array(GIF));

  check("the same bytes produce the same key", first.ok && first.key === again.key, first.key);
  check("different bytes produce a different key", other.ok && other.key !== first.key, other.key);
  check("the key fits the varchar(100) columns that hold it", first.key.length <= 100, `${first.key.length} chars`);
  check(
    "a file that is not an image type is refused",
    objectKeyFor("logo", "notes.pdf", new Uint8Array([1])).ok === false,
  );

  // --- upload ----------------------------------------------------------------
  await putObject(first.key, new Uint8Array(PNG), first.contentType);
  madeKeys.add(first.key);
  check("an upload lands in the bucket", await objectExists(first.key), first.key);

  // Idempotent by construction: the key is a digest of the bytes, so a retry
  // that may or may not have landed the first time writes to the same place.
  await putObject(first.key, new Uint8Array(PNG), first.contentType);
  check("uploading the same bytes again is harmless", await objectExists(first.key));

  // --- reference counting ----------------------------------------------------
  check("an unreferenced key reports as such", (await isReferenced(first.key)) === false);
  check("an empty key is never treated as an orphan", (await isReferenced("")) === true);
  check(
    "a key the live data shares is referenced",
    await isReferenced("profile/ridwaanhall_20250913_2.webp"),
  );

  const [orgA] = await db
    .insert(aboutOrganization)
    .values({ name: `${MARK} A`, slug: `${MARK}-a`, website: "", logo: first.key })
    .returning({ id: aboutOrganization.id });
  const [orgB] = await db
    .insert(aboutOrganization)
    .values({ name: `${MARK} B`, slug: `${MARK}-b`, website: "", logo: first.key })
    .returning({ id: aboutOrganization.id });
  madeRows.push(orgA.id, orgB.id);

  check("a key one row names is referenced", await isReferenced(first.key), `#${orgA.id}, #${orgB.id}`);

  // Take one row away. The file must survive, because the other still names it.
  await db.delete(aboutOrganization).where(eq(aboutOrganization.id, orgA.id));
  madeRows.splice(madeRows.indexOf(orgA.id), 1);
  const keptResult = await deleteUnreferenced([first.key]);
  check(
    "removing one of two sharing rows leaves the file alone",
    keptResult.kept.includes(first.key) && (await objectExists(first.key)),
    `kept ${JSON.stringify(keptResult.kept)}`,
  );

  // Take the other. Now nothing names it.
  await db.delete(aboutOrganization).where(eq(aboutOrganization.id, orgB.id));
  madeRows.splice(madeRows.indexOf(orgB.id), 1);
  const goneResult = await deleteUnreferenced([first.key]);
  check(
    "removing the last one deletes the file",
    goneResult.deleted.includes(first.key) && (await objectExists(first.key)) === false,
    `deleted ${JSON.stringify(goneResult.deleted)}`,
  );
  madeKeys.delete(first.key);

  // --- delete is forgiving ---------------------------------------------------
  // Supabase answers a missing object with HTTP 400 and a NoSuchKey body rather
  // than a 404, so this is the case the status code alone cannot recognise.
  let threw = false;
  try {
    await deleteObject(`logo/${MARK}-definitely-not-there.png`);
  } catch {
    threw = true;
  }
  check("deleting a key that is not there is not an error", threw === false);

  // --- the column list is complete -------------------------------------------
  const declared = new Set(FILE_COLUMNS.map((column) => `${column.table[Symbol.for("drizzle:Name")]}.${column.name}`));
  const { rows: candidates } = await pool.query(`
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public'
      and data_type in ('character varying', 'text')
  `);

  const found = new Set();
  for (const { table_name: table, column_name: column } of candidates) {
    const { rows } = await pool.query(
      `select 1 from "${table}" where "${column}" ~ '^(profile|logo|blog|project)/.+\\.(webp|png|jpe?g|gif|avif|svg)$' limit 1`,
    );
    if (rows.length > 0) found.add(`${table}.${column}`);
  }

  const missing = [...found].filter((name) => !declared.has(name));
  check(
    "every column holding storage keys is declared in FILE_COLUMNS",
    missing.length === 0,
    missing.length ? `undeclared: ${missing.join(", ")}` : `${found.size} columns, all declared`,
  );
  check(
    "and FILE_COLUMNS names nothing that does not exist",
    [...declared].every((name) => candidates.some((row) => `${row.table_name}.${row.column_name}` === name)),
  );
} finally {
  for (const id of madeRows) {
    await db.delete(aboutOrganization).where(eq(aboutOrganization.id, id));
    console.log(`  ..    cleaned up organization #${id}`);
  }
  for (const key of madeKeys) {
    await deleteObject(key).catch(() => {});
    console.log(`  ..    cleaned up object ${key}`);
  }

  const leftover = await db
    .select({ id: aboutOrganization.id })
    .from(aboutOrganization)
    .where(like(aboutOrganization.name, `${MARK}%`));
  check("no rows are left behind", leftover.length === 0);
  if (leftover.length > 0) {
    await db.delete(aboutOrganization).where(
      inArray(aboutOrganization.id, leftover.map((row) => row.id)),
    );
  }

  await pool.end();
}

const failed = checks.filter((entry) => !entry.pass);
console.log(
  failed.length === 0
    ? `\nAll ${checks.length} storage checks passed.`
    : `\n${failed.length} of ${checks.length} checks FAILED.`,
);
process.exit(failed.length === 0 ? 0 : 1);
