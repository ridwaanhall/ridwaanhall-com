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
 * The display URL for every stored image on a form, keyed by the input's name.
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
 * where the file is: the 74 bundled skill icons are `source: "static"` and
 * resolve to a path under `public/`, everything else is an object in the bucket.
 * Sending every key to the bucket URL asked Supabase for
 * `.../media//static/svg/icon/uv.svg` and got `NoSuchKey` back, so all 78 icons
 * previewed broken. `assetUrl` is the single thing that knows which is which --
 * one query here feeds it, rather than each caller guessing.
 */
export async function imageUrlMap(
  model: AdminFormModel,
  values: FormValues,
  inlineRows: Record<string, FormValues[]> = {},
): Promise<Record<string, string>> {
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

  const sources = await sourcesForKeys(Object.values(keyByName));

  const urls: Record<string, string> = {};
  for (const [name, key] of Object.entries(keyByName)) {
    const source = sources.get(key);
    // A key with no asset row is nothing this owns -- an OAuth avatar is stored
    // as a full URL. `mediaUrl` passes those through untouched.
    urls[name] = source === undefined ? mediaUrl(key) : assetUrl({ storageKey: key, source });
  }
  return urls;
}

/** Where each of these keys is served from, for the keys that name an asset. */
async function sourcesForKeys(keys: string[]): Promise<Map<string, string>> {
  const wanted = [...new Set(keys.filter(Boolean))];
  if (wanted.length === 0) return new Map();

  const rows = await db
    .select({ storageKey: mediaAsset.storageKey, source: mediaAsset.source })
    .from(mediaAsset)
    .where(inArray(mediaAsset.storageKey, wanted));

  return new Map(rows.map((row) => [row.storageKey, row.source]));
}
