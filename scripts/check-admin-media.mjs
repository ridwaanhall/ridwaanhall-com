/**
 * The seam between an image field and a `media_asset` row.
 *
 * A form works in storage keys ("project/foo.webp"); the schema works in ids,
 * because one file is named by many records and repeating the string in each is
 * what reference counting exists to avoid. `lib/admin/media.ts` is the one place
 * that converts, and nothing in the type system says a caller went through it --
 * both sides are `string`, so handing a uuid to something expecting a key type
 * checks, builds, lints, and renders.
 *
 * It renders *wrongly*. The admin asked the bucket for `.../media/<uuid>` and
 * Supabase answered `NoSuchKey`, so every blog gallery and every project gallery
 * previewed a broken image -- while the public site, which reads through
 * `assetUrl`, was correct throughout. Only the record's own fields were being
 * converted; its inline rows were not.
 *
 * Four properties, none of them visible to `tsc`:
 *
 * - **A form value is a key, never an id.** For the record and for its inlines
 *   alike. A uuid here is the bug above.
 * - **Every preview URL resolves.** A storage asset has an object behind it; a
 *   static one is a path under `public/` with a file behind it. Sending a static
 *   key to the bucket is the second half of the same mistake -- all 78 skill
 *   icons previewed broken, because a key alone does not say where it is served
 *   from and `source` was never consulted.
 * - **The conversion round-trips.** `mediaIdForKey` is an upsert, so asking for
 *   the key of an id and then the id of that key must return the id it started
 *   from -- if it created a second row instead, reference counting would under-
 *   count and `deleteUnreferenced` would delete a file another record still
 *   names.
 * - **Cleanup is handed keys.** `inlineImageKeys` feeds `deleteUnreferenced`,
 *   which counts references by `storage_key`. Given uuids it matches nothing,
 *   deletes nothing, and leaks every object a deleted gallery used to hold.
 *
 * Read-only: it opens live records but writes nothing, so there is nothing to
 * restore.
 *
 *   npx tsx --conditions=react-server scripts/check-admin-media.mjs
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const { db, pool } = await import("../lib/db/client.ts");
const { mediaAsset } = await import("../lib/db/app-schema.ts");
const { ADMIN_FORM_MODELS } = await import("../lib/admin/models/index.ts");
const { formFields } = await import("../lib/admin/form.ts");
const { imageFields } = await import("../lib/admin/images.ts");
const { loadFormValues } = await import("../lib/admin/record.ts");
const { loadInlineRows, inlineImageKeys } = await import("../lib/admin/inlines.ts");
const { imageUrlMap, keyForMediaId, mediaIdForKey } = await import("../lib/admin/media.ts");
const { objectExists } = await import("../lib/storage/objects.ts");
const { eq, isNotNull } = await import("drizzle-orm");

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push({ name, pass });
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Every key the database knows, with where it is served from. */
const assets = new Map(
  (await db.select({ storageKey: mediaAsset.storageKey, source: mediaAsset.source }).from(mediaAsset))
    .map((row) => [row.storageKey, row.source]),
);

/**
 * A record that actually holds an image, for a model that has such a field.
 *
 * Picking the first row would usually find a null one, and a null image proves
 * nothing about how a non-null one is converted.
 */
async function recordWithImage(model, field) {
  const [row] = await db
    .select({ id: model.pk })
    .from(model.from)
    .where(isNotNull(field.column))
    .limit(1);
  return row ? String(row.id) : null;
}

async function parentWithInlineImage(model, inline, field) {
  const [row] = await db
    .select({ id: inline.parent })
    .from(inline.table)
    .where(isNotNull(field.column))
    .limit(1);
  return row ? String(row.id) : null;
}

console.log("\nform values are storage keys, not asset ids\n");

/** Name -> key, for every image a form would render, across every model. */
const previews = new Map();

for (const [key, model] of Object.entries(ADMIN_FORM_MODELS)) {
  for (const field of imageFields(formFields(model))) {
    const id = await recordWithImage(model, field);
    if (id === null) continue;
    const values = await loadFormValues(model, id);
    const value = values[field.name];
    check(
      `${key}.${field.name} is a key`,
      typeof value === "string" && value !== "" && !UUID.test(value) && assets.has(value),
      String(value),
    );
    for (const [name, url] of Object.entries(await imageUrlMap(model, values, {}))) {
      previews.set(`${key}.${name}`, url);
    }
  }

  for (const inline of model.inlines ?? []) {
    for (const field of imageFields(inline.fields)) {
      const parentId = await parentWithInlineImage(model, inline, field);
      if (parentId === null) continue;
      const rows = await loadInlineRows(inline, parentId);
      const value = rows[0]?.[field.name];
      check(
        `${key}/${inline.name}.${field.name} is a key`,
        typeof value === "string" && value !== "" && !UUID.test(value) && assets.has(value),
        String(value),
      );
      for (const [name, url] of Object.entries(
        await imageUrlMap(model, await loadFormValues(model, parentId), { [inline.name]: rows }),
      )) {
        previews.set(`${key}/${name}`, url);
      }

      /*
       * What the parent's delete hands `deleteUnreferenced`. Ids here match no
       * `storage_key`, so the count comes back zero and the objects are left
       * behind -- silently, because deleting nothing is not an error.
       */
      const cleanup = await inlineImageKeys(model, parentId);
      check(
        `${key}/${inline.name} cleanup gets keys`,
        cleanup.length > 0 && cleanup.every((entry) => !UUID.test(entry) && assets.has(entry)),
        `${cleanup.length} key(s)`,
      );
    }
  }
}

console.log("\nevery preview URL resolves\n");

for (const [name, url] of previews) {
  if (url.startsWith("/")) {
    // A static asset is served by the app from `public/`, so the file is on disk.
    check(`${name} -> ${url}`, existsSync(join(process.cwd(), "public", url)));
    continue;
  }
  const match = /\/storage\/v1\/object\/public\/[^/]+\/(.+)$/.exec(url);
  if (!match) {
    check(`${name} is a storage URL`, false, url);
    continue;
  }
  const key = decodeURIComponent(match[1]);
  check(`${name} -> ${key}`, await objectExists(key));
}

console.log("\nthe conversion round-trips\n");

/*
 * `mediaIdForKey` upserts. Asking it for a key that already has a row must
 * return that row rather than making a second one -- a duplicate would split
 * the reference count in two, and a file two records share would be deleted
 * when one of them let go.
 */
const [sample] = await db
  .select({ id: mediaAsset.id, storageKey: mediaAsset.storageKey })
  .from(mediaAsset)
  .where(eq(mediaAsset.source, "storage"))
  .limit(1);

if (sample) {
  const key = await keyForMediaId(sample.id);
  check("id -> key", key === sample.storageKey, key);
  check("key -> id is the same row", (await mediaIdForKey(key)) === sample.id);
}

const failed = checks.filter((entry) => !entry.pass);
console.log(`\n${checks.length - failed.length}/${checks.length} passed\n`);

await pool.end();
process.exit(failed.length === 0 ? 0 : 1);
