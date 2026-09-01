/**
 * Is the bucket still in step with the database?
 *
 * Nothing else asks this. `scripts/check-storage.mjs` proves that
 * `FILE_COLUMNS` names every column that can hold a file, and
 * `check-admin-forms.mjs` and `check-admin-image-link.mjs` prove that replacing
 * or removing an image deletes the object it replaced -- but all three reason
 * from the database outwards. None of them looks at what is actually in the
 * bucket, so an object that leaked before those checks existed, or one left
 * behind by a cleanup that overran its budget, is invisible to every one of
 * them.
 *
 * Three questions, and they fail in different directions:
 *
 *   leaked      an object no `media_asset` row names. Costs storage forever and
 *               nothing will ever collect it: `deleteUnreferenced` works from
 *               the rows, so a file the rows have forgotten is a file it cannot
 *               see.
 *   dangling    a `media_asset` row whose object is gone. Renders as a broken
 *               image wherever it is named, and `mediaIdForKey` hands the row
 *               back for a re-upload of the same bytes instead of registering
 *               the new object.
 *   unreferenced  an asset no row points at any more. Not yet a fault -- this
 *               is what the next cleanup would remove -- but a number that only
 *               grows means cleanup is not running.
 *
 * **An audit, not a check.** It reports and exits 0, because what it finds is a
 * judgement call: deleting somebody's file because this script cannot find a
 * row for it is exactly the mistake reference counting exists to prevent, and
 * it deserves a person looking at the list first.
 *
 * Reads only, here and in the bucket.
 *
 *   npx tsx --conditions=react-server scripts/audit-storage.mjs
 */
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const { db, pool } = await import("../lib/db/client.ts");
const { mediaAsset } = await import("../lib/db/app-schema.ts");
const { FILE_COLUMNS } = await import("../lib/storage/cleanup.ts");
const { sql } = await import("drizzle-orm");

const URL_BASE = (process.env.STORAGE_SUPABASE_URL ?? "").replace(/\/+$/, "");
const KEY = process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY ?? "";
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "media";

/** Every object in the bucket, walking the prefixes the uploads use. */
async function listAll(prefix = "") {
  const out = [];
  for (let offset = 0; ; offset += 100) {
    const res = await fetch(`${URL_BASE}/storage/v1/object/list/${BUCKET}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, apikey: KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ prefix, limit: 100, offset, sortBy: { column: "name", order: "asc" } }),
    });
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) break;
    for (const row of rows) {
      // A folder has no id; recurse into it.
      if (row.id === null) out.push(...(await listAll(`${prefix}${row.name}/`)));
      else out.push({ key: `${prefix}${row.name}`, size: row.metadata?.size ?? 0 });
    }
    if (rows.length < 100) break;
  }
  return out;
}

const objects = await listAll();
const assets = await db.select({ id: mediaAsset.id, storageKey: mediaAsset.storageKey, source: mediaAsset.source }).from(mediaAsset);
const storage = assets.filter((a) => a.source === "storage");

const objectKeys = new Set(objects.map((o) => o.key));
const assetKeys = new Set(storage.map((a) => a.storageKey));

// Which asset ids any row still points at, across all six columns.
const referenced = new Set();
for (const column of FILE_COLUMNS) {
  const rows = await db.execute(sql`select distinct ${column} as id from ${column.table} where ${column} is not null`);
  for (const row of rows.rows) referenced.add(String(row.id));
}

const orphanObjects = objects.filter((o) => !assetKeys.has(o.key));
const danglingAssets = storage.filter((a) => !objectKeys.has(a.storageKey));
const unreferenced = storage.filter((a) => !referenced.has(a.id));

const mb = (n) => `${(n / 1024 / 1024).toFixed(2)}MB`;
console.log(`\nbucket "${BUCKET}": ${objects.length} object(s), ${mb(objects.reduce((s, o) => s + o.size, 0))}`);
console.log(`media_asset rows: ${assets.length} (${storage.length} storage, ${assets.length - storage.length} static)\n`);

console.log(`objects with no media_asset row (leaked): ${orphanObjects.length}`);
for (const o of orphanObjects.slice(0, 15)) console.log(`   ${o.key}  ${mb(o.size)}`);
console.log(`\nmedia_asset rows whose object is gone: ${danglingAssets.length}`);
for (const a of danglingAssets.slice(0, 15)) console.log(`   ${a.storageKey}`);
console.log(`\nassets no row points at (would be deleted on next cleanup): ${unreferenced.length}`);
for (const a of unreferenced.slice(0, 15)) console.log(`   ${a.storageKey}`);

await pool.end();
