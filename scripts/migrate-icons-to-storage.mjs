/**
 * Move the bundled skill icons into Supabase Storage.
 *
 * The 74 SVGs under `public/static/svg/icon/` are registered as `media_asset`
 * rows with `source: "static"`, which `assetUrl` resolves to a path this app
 * serves itself. This uploads each one to the bucket and repoints its row, so
 * every image the site and the admin render comes from the same place.
 *
 * **The files under `public/` are deliberately left where they are.**
 * `skill.iconId` is one of the columns `lib/storage/cleanup.ts` counts
 * references over, and `deleteUnreferenced` does not consult `source`. Before
 * this migration, unlinking the last skill that named an icon aimed a delete at
 * a bucket path that was never there and the bundled file survived. After it,
 * that same action deletes the object and its row for good -- so the copy in
 * the repository is the way back, and re-running this script is how you take
 * it.
 *
 * Which it is safe to do. `objectKeyFor` derives the key from a digest of the
 * content, so re-uploading writes identical bytes to the same key, and the row
 * update matches on the old key -- a second run finds the rows already moved
 * and says so rather than reporting them missing.
 *
 * Uploads happen before any row is updated, never the reverse: an object no row
 * points at is invisible, while a row pointing at an object that is not there is
 * a broken image on every skill that names it.
 *
 *   node scripts/migrate-icons-to-storage.mjs            # dry run
 *   node scripts/migrate-icons-to-storage.mjs --apply
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const APPLY = process.argv.includes("--apply");

const { db, pool } = await import("../lib/db/client.ts");
const { mediaAsset } = await import("../lib/db/app-schema.ts");
const { objectKeyFor } = await import("../lib/storage/keys.ts");
const { putObject, storageConfigured } = await import("../lib/storage/objects.ts");
const { eq, sql } = await import("drizzle-orm");

const ICON_DIR = join("public", "static", "svg", "icon");
/** The shape of the keys these rows hold today, and what a moved row no longer looks like. */
const STATIC_PREFIX = "/static/svg/icon/";

if (!storageConfigured()) {
  console.error(
    "Supabase Storage is not configured. STORAGE_SUPABASE_URL and\n" +
      "STORAGE_SUPABASE_SERVICE_ROLE_KEY must both be set.",
  );
  process.exit(1);
}

if (!existsSync(ICON_DIR)) {
  console.error(`${ICON_DIR} does not exist -- nothing to migrate.`);
  process.exit(1);
}

const files = readdirSync(ICON_DIR)
  .filter((name) => name.toLowerCase().endsWith(".svg"))
  .sort();

console.log(
  `${files.length} icon(s) in ${ICON_DIR}${APPLY ? "" : "  (dry run -- pass --apply to write)"}\n`,
);

/*
 * Plan every icon before touching anything.
 *
 * A file whose key cannot be built, or whose row is nowhere to be found, is a
 * reason to stop rather than to migrate the other seventy-three: a half-moved
 * catalogue is the state that is hardest to reason about afterwards.
 */
const planned = [];
const problems = [];
let alreadyDone = 0;

for (const filename of files) {
  const bytes = new Uint8Array(readFileSync(join(ICON_DIR, filename)));
  const built = objectKeyFor("icon", filename, bytes);
  if (!built.ok) {
    problems.push(`${filename}: ${built.error}`);
    continue;
  }

  const oldKey = `${STATIC_PREFIX}${filename}`;
  const [existing] = await db
    .select({ id: mediaAsset.id, source: mediaAsset.source })
    .from(mediaAsset)
    .where(eq(mediaAsset.storageKey, oldKey))
    .limit(1);

  if (!existing) {
    // Either it moved on an earlier run, or nothing ever named this file. The
    // first is fine and the second is not, so they are told apart rather than
    // lumped together.
    const [moved] = await db
      .select({ id: mediaAsset.id })
      .from(mediaAsset)
      .where(eq(mediaAsset.storageKey, built.key))
      .limit(1);
    if (moved) {
      alreadyDone++;
      continue;
    }
    problems.push(`${filename}: no media_asset row holds "${oldKey}"`);
    continue;
  }

  planned.push({ filename, oldKey, newKey: built.key, contentType: built.contentType, bytes });
}

if (alreadyDone) console.log(`  ..    ${alreadyDone} icon(s) already moved on an earlier run\n`);

if (problems.length > 0) {
  console.error(`Refusing to migrate -- ${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  FAIL  ${problem}`);
  await pool.end();
  process.exit(1);
}

if (planned.length === 0) {
  console.log("Nothing to do.");
  await pool.end();
  process.exit(0);
}

for (const { filename, newKey } of planned.slice(0, 5)) {
  console.log(`  ${filename.padEnd(34)} -> ${newKey}`);
}
if (planned.length > 5) console.log(`  ... and ${planned.length - 5} more`);
console.log("");

if (!APPLY) {
  console.log(`${planned.length} icon(s) would move. Nothing was written.`);
  await pool.end();
  process.exit(0);
}

// Objects first. An upload that lands for a row that is never updated leaves an
// unreferenced object, which the next cleanup collects; the reverse leaves a
// broken image on the site.
let uploaded = 0;
for (const { filename, newKey, contentType, bytes } of planned) {
  try {
    await putObject(newKey, bytes, contentType);
    uploaded++;
  } catch (error) {
    console.error(`\n  FAIL  uploading ${filename}: ${error.message}`);
    console.error("  No rows were changed.");
    await pool.end();
    process.exit(1);
  }
}
console.log(`  ok    uploaded ${uploaded} object(s)`);

// Rows second, in one transaction, so a failure part-way leaves the table whole.
await db.transaction(async (tx) => {
  for (const { filename, oldKey, newKey } of planned) {
    await tx
      .update(mediaAsset)
      .set({ storageKey: newKey, source: "storage", originalFilename: filename })
      .where(eq(mediaAsset.storageKey, oldKey));
  }
});
console.log(`  ok    repointed ${planned.length} media_asset row(s)`);

const [{ leftover }] = await db
  .select({ leftover: sql`count(*)::int`.as("leftover") })
  .from(mediaAsset)
  .where(sql`${mediaAsset.source} = 'static' or ${mediaAsset.storageKey} like '/static/%'`);
console.log(
  `  ${leftover === 0 ? "ok  " : "FAIL"}  rows still static or still pointing under /static: ${leftover}`,
);

await pool.end();
process.exit(leftover === 0 ? 0 : 1);
