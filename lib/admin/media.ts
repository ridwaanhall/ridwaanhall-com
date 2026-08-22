import "server-only";

import { eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { mediaAsset } from "@/lib/db/app-schema";

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
