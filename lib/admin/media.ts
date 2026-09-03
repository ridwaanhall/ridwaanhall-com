import "server-only";

import { eq, inArray } from "drizzle-orm";

import {
  inlineFieldName,
  type AdminFormModel,
  type FormValues,
} from "@/lib/admin/form";
import { db } from "@/lib/db/client";
import { mediaAsset } from "@/lib/db/app-schema";
import { assetUrl, mediaUrl } from "@/lib/storage/media";

/**
 * The bridge between an image field and a `media_asset` row.
 *
 * The admin's image control works in storage keys: it uploads a file, names it
 * after its contents, and hands back `blog/commit_style.webp`. The schema works
 * in ids -- a column like `blog_image.media_id` points at a row, so one file can
 * be named by twenty-one records without the string being repeated in each.
 *
 * Rather than teach the upload control about rows, or the schema about strings,
 * the conversion happens here, at the one seam between them. The form still
 * sees keys; the database still sees ids.
 *
 * **The upsert is what makes reference counting work.** A key that already has
 * a row returns that row's id, so uploading the same photo to a second record
 * links the two to one asset instead of creating a duplicate -- which is the
 * property `lib/storage/cleanup.ts` depends on before it deletes an object.
 */

/** The id for a storage key, creating the asset row the first time it is seen. */
export async function mediaIdForKey(key: string): Promise<string | null> {
  if (!key) return null;

  const [existing] = await db
    .select({ id: mediaAsset.id })
    .from(mediaAsset)
    .where(eq(mediaAsset.storageKey, key))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(mediaAsset)
    .values({
      storageKey: key,
      source: "storage",
      // The uploaded name, which is what the gallery keys its lookup on.
      originalFilename: key.split("/").pop() ?? "",
    })
    .returning({ id: mediaAsset.id });

  return created?.id ?? null;
}

/** Storage keys for a set of asset ids, for showing what a record currently holds. */
export async function keysForMediaIds(ids: string[]): Promise<Map<string, string>> {
  const wanted = ids.filter(Boolean);
  if (wanted.length === 0) return new Map();

  const rows = await db
    .select({ id: mediaAsset.id, storageKey: mediaAsset.storageKey })
    .from(mediaAsset)
    .where(inArray(mediaAsset.id, wanted));

  return new Map(rows.map((row) => [row.id, row.storageKey]));
}

/** One id's key, or `""`. */
export async function keyForMediaId(id: string | null | undefined): Promise<string> {
  if (!id) return "";
  return (await keysForMediaIds([id])).get(id) ?? "";
}

/**
 * The display URL and the alt text for every stored image on a form, each
 * keyed by the input's name.
 *
 * **This cannot live in `lib/admin/form.ts`.** That module is part of the client
 * bundle -- it has no `"use client"` of its own, but `record-form.tsx` imports
 * it, which is enough -- and the URL is built from `STORAGE_SUPABASE_URL`, which
 * is not a `NEXT_PUBLIC_` variable. So the server built
 * `https://<project>.supabase.co/storage/v1/object/...` and the browser built
 * `/storage/v1/object/...` from an empty string, and React reported the pair as
 * a hydration mismatch on the `<img>`.
 *
 * It looked harmless because React does not patch attribute mismatches: the
 * server's URL stayed in the DOM and the preview appeared. It only broke on the
 * *next* client render of that subtree -- pressing Save re-renders the whole
 * form to disable it -- and the preview turned into a broken image on the way
 * to a page that had saved correctly.
 *
 * Resolving here keeps the storage configuration server-side, which is where the
 * rest of it lives, and costs one flat object on the payload. The key is the
 * input's `name`, so one map covers the form's own fields and every inline row
 * without the caller having to know which is which.
 *
 * **The source is looked up rather than assumed.** A key alone does not say
 * where the file is served from -- `media_asset.source` does, and the column
 * still permits either answer. Every asset is an object in the bucket today,
 * the skill icons included since they were migrated there, but the lookup stays
 * because assuming was the bug: sending every key to the bucket URL asked
 * Supabase for a path that had never been an object and got `NoSuchKey` back,
 * so all 78 icon previews broke at once. `assetUrl` is the single thing that
 * knows which is which -- one query here feeds it, rather than each caller
 * guessing.
 */
export async function imageMeta(
  model: AdminFormModel,
  values: FormValues,
  inlineRows: Record<string, FormValues[]> = {},
): Promise<{ imageUrls: Record<string, string>; imageAlts: Record<string, string> }> {
  const keyByName: Record<string, string> = {};

  const add = (name: string, value: unknown) => {
    if (typeof value === "string" && value) keyByName[name] = value;
  };

  for (const fieldset of model.fieldsets) {
    for (const field of fieldset.fields) {
      if (field.kind === "image") add(field.name, values[field.name]);
    }
  }

  for (const inline of model.inlines ?? []) {
    const rows = inlineRows[inline.name] ?? [];
    for (const [index, row] of rows.entries()) {
      for (const field of inline.fields) {
        if (field.kind === "image") {
          add(inlineFieldName(inline.name, index, field.name), row[field.name]);
        }
      }
    }
  }

  // One query for both facts. They come off the same row, and an admin form
  // render asking twice for it is two round trips to Supabase for nothing.
  const assets = await assetsForKeys(Object.values(keyByName));

  // Named as the props they become, so a caller spreads them rather than
  // restating the pair at each of the two form screens.
  const imageUrls: Record<string, string> = {};
  const imageAlts: Record<string, string> = {};
  for (const [name, key] of Object.entries(keyByName)) {
    const asset = assets.get(key);
    // A key with no asset row is nothing this owns -- an OAuth avatar is stored
    // as a full URL. `mediaUrl` passes those through untouched, and there is no
    // row to have described it.
    imageUrls[name] =
      asset === undefined ? mediaUrl(key) : assetUrl({ storageKey: key, source: asset.source });
    imageAlts[name] = asset?.alt ?? "";
  }
  return { imageUrls, imageAlts };
}

/** Where each of these keys is served from, and how it is described. */
async function assetsForKeys(keys: string[]): Promise<Map<string, { source: string; alt: string }>> {
  const wanted = [...new Set(keys.filter(Boolean))];
  if (wanted.length === 0) return new Map();

  const rows = await db
    .select({ storageKey: mediaAsset.storageKey, source: mediaAsset.source, alt: mediaAsset.alt })
    .from(mediaAsset)
    .where(inArray(mediaAsset.storageKey, wanted));

  return new Map(rows.map((row) => [row.storageKey, { source: row.source, alt: row.alt }]));
}

/**
 * Describe these images, by storage key.
 *
 * Keyed on the key rather than on the record, because that is what the column
 * is keyed on. Writing the same alt twice for one key is a no-op, so a form
 * carrying the same photo in two fields does not fight itself.
 *
 * A blank clears it. `media_asset.alt` is `NOT NULL DEFAULT ''`, and empty is
 * the honest value for a decorative image -- a screen reader skips an `alt=""`
 * and announces the filename of a missing one.
 */
export async function setImageAlts(alts: Record<string, string>): Promise<void> {
  const entries = Object.entries(alts).filter(([key]) => key);
  if (entries.length === 0) return;

  await Promise.all(
    entries.map(([key, alt]) =>
      db.update(mediaAsset).set({ alt }).where(eq(mediaAsset.storageKey, key)),
    ),
  );
}
