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
const { mediaAsset, organization } = await import("../lib/db/app-schema.ts");
const { mediaIdForKey } = await import("../lib/admin/media.ts");
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

  /*
   * Both rows point at the same asset, which is the whole property under test.
   * They used to repeat the storage key in a `varchar` each; the key is written
   * once on `media_asset` now and `mediaIdForKey` is the upsert that makes the
   * second reference find the first row rather than create a duplicate.
   */
  const firstAsset = await mediaIdForKey(first.key);
  const [orgA] = await db
    .insert(organization)
    .values({ name: `${MARK} A`, slug: `${MARK}-a`, website: "", logoId: firstAsset })
    .returning({ id: organization.id });
  const [orgB] = await db
    .insert(organization)
    .values({ name: `${MARK} B`, slug: `${MARK}-b`, website: "", logoId: firstAsset })
    .returning({ id: organization.id });
  madeRows.push(orgA.id, orgB.id);

  check("a key one row names is referenced", await isReferenced(first.key), `#${orgA.id}, #${orgB.id}`);

  // Take one row away. The file must survive, because the other still names it.
  await db.delete(organization).where(eq(organization.id, orgA.id));
  madeRows.splice(madeRows.indexOf(orgA.id), 1);
  const keptResult = await deleteUnreferenced([first.key]);
  check(
    "removing one of two sharing rows leaves the file alone",
    keptResult.kept.includes(first.key) && (await objectExists(first.key)),
    `kept ${JSON.stringify(keptResult.kept)}`,
  );

  // Take the other. Now nothing names it.
  await db.delete(organization).where(eq(organization.id, orgB.id));
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
  /*
   * Every column that can name a file, found from the catalogue rather than
   * from a pattern.
   *
   * This scanned all `text` columns for values shaped like a storage key, which
   * was the only way to find them while five tables each stored the key itself.
   * There is one key column now -- `media_asset.storage_key` -- and everything
   * that names a file does so with a foreign key to that table. So the question
   * "did somebody add a column holding files without telling `FILE_COLUMNS`?"
   * is answered exactly by the foreign keys, with no heuristic in the middle.
   */
  const declared = new Set(
    FILE_COLUMNS.map((column) => `${column.table[Symbol.for("drizzle:Name")]}.${column.name}`),
  );
  const { rows: referring } = await pool.query(`
    select t.relname as table_name, a.attname as column_name
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_class f on f.oid = c.confrelid
      join pg_namespace n on n.oid = t.relnamespace
      join unnest(c.conkey) k(attnum) on true
      join pg_attribute a on a.attrelid = t.oid and a.attnum = k.attnum
     where n.nspname = 'app' and c.contype = 'f' and f.relname = 'media_asset'
     order by 1, 2
  `);

  const actual = new Set(referring.map((row) => `${row.table_name}.${row.column_name}`));
  const missing = [...actual].filter((name) => !declared.has(name));
  const extra = [...declared].filter((name) => !actual.has(name));

  check(
    "every column that can name a file is declared in FILE_COLUMNS",
    missing.length === 0,
    missing.length ? `undeclared: ${missing.join(", ")}` : `${actual.size} columns, all declared`,
  );
  check(
    "and FILE_COLUMNS names nothing that does not exist",
    extra.length === 0,
    extra.join(", "),
  );
} finally {
  for (const id of madeRows) {
    await db.delete(organization).where(eq(organization.id, id));
    console.log(`  ..    cleaned up organization #${id}`);
  }
  for (const key of madeKeys) {
    await deleteObject(key).catch(() => {});
    console.log(`  ..    cleaned up object ${key}`);
  }

  /*
   * The asset rows too. `mediaIdForKey` creates one per key it has not seen,
   * so a run that uploads three files registers three -- and a row pointing at
   * an object this then deleted is exactly the orphan the harness exists to
   * complain about.
   */
  // Asset rows are cleaned up below, by the same marker that finds stray
  // organizations -- `deleteUnreferenced` removes the row along with the
  // object, so what is left here is only what this harness registered and
  // never deleted through it.

  const leftover = await db
    .select({ id: organization.id })
    .from(organization)
    .where(like(organization.name, `${MARK}%`));
  const strayAssets = await db
    .select({ id: mediaAsset.id })
    .from(mediaAsset)
    .where(like(mediaAsset.storageKey, `%${MARK}%`));
  check(
    "no rows are left behind",
    leftover.length === 0 && strayAssets.length === 0,
    `${leftover.length} organization(s), ${strayAssets.length} asset(s)`,
  );
  if (leftover.length > 0) {
    await db.delete(organization).where(
      inArray(organization.id, leftover.map((row) => row.id)),
    );
  }
  if (strayAssets.length > 0) {
    await db.delete(mediaAsset).where(inArray(mediaAsset.id, strayAssets.map((row) => row.id)));
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
