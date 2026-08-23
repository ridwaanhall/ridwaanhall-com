import "server-only";

import { eq, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

import { deleteObject } from "@/lib/storage/objects";
import { db } from "@/lib/db/client";
import {
  blogImage,
  blogPost,
  mediaAsset,
  organization,
  profile,
  projectImage,
  skill,
} from "@/lib/db/app-schema";

/**
 * Remove a stored file once nothing points at it any more.
 *
 * **Reference counting is not defensive here, it is load-bearing**, and the
 * live data says so plainly: the author
 * photo `profile/ridwaanhall_20250913_2.webp` is named by 21 rows -- all twenty
 * blog posts and the profile -- `logo/al_mukmin_ngruki.webp` by three
 * organisations, `logo/linkedin.webp` by two. Deleting because *one* referring
 * row went away would break the live images on all the others.
 *
 * Nothing is removed until no row on any of the five columns still names it.
 * The check runs after the write, so the row being edited already reflects its
 * new value and needs no special case.
 */

/**
 * Every column that names a stored file.
 *
 * These held the storage key itself -- five `varchar` columns each repeating
 * `profile/ridwaanhall_20250913_2.webp` in full. They are foreign keys into
 * `media_asset` now, so the key is written once and a row points at it, and the
 * count below is a count of pointers rather than of repeated strings.
 *
 * The columns are listed rather than discovered, because there is no reliable
 * reflection over the schema for "columns that can name a file". A column added
 * without being listed here would leak its files silently, which is why
 * `scripts/check-storage.mjs` counts this list against the live catalogue.
 */
export const FILE_COLUMNS: PgColumn[] = [
  profile.imageId,
  organization.logoId,
  blogPost.authorImageId,
  blogImage.mediaId,
  projectImage.mediaId,
  skill.iconId,
];

/**
 * How long all cleanup for one operation may take, in total.
 *
 * The bound has to span the operation rather than each call, because the calls
 * arrive one per row: deleting a project takes its images with it -- seven on
 * the largest live row -- and each is a separate round trip to Supabase. A
 * per-call limit would reset seven times and bound nothing. This is the same
 * shape as the upload budget: a per-operation timeout says nothing about total
 * time when the operation count is unbounded.
 *
 * Overrunning leaves orphaned objects in the bucket, which is the acceptable
 * outcome -- far better than running past the gateway timeout and losing the
 * delete that triggered it.
 */
export const CLEANUP_BUDGET_MS = 10_000;

/**
 * Is any row, on any model, still storing this key?
 *
 * One statement rather than one per column. Every round trip crosses the
 * network to Supabase, and this runs once per file in a cascade.
 */
export async function isReferenced(key: string): Promise<boolean> {
  // An empty key is nothing to delete. Reporting it as referenced is what stops
  // a caller treating "no file" as "an orphan to clean up".
  if (!key) return true;

  /*
   * The key is resolved to its asset once, and the columns are then asked about
   * that id. Comparing each column to the key directly is no longer possible --
   * they hold ids -- and resolving per column would repeat the same lookup six
   * times in a statement that runs once per file in a cascade.
   *
   * A key with no asset row is a file nothing could be pointing at, which is an
   * orphan and the honest answer is `false`.
   */
  const [asset] = await db
    .select({ id: mediaAsset.id })
    .from(mediaAsset)
    .where(eq(mediaAsset.storageKey, key))
    .limit(1);
  if (!asset) return false;

  const clauses = FILE_COLUMNS.map(
    (column) => sql`exists (select 1 from ${column.table} where ${column} = ${asset.id})`,
  );
  const result = await db.execute<{ referenced: boolean }>(
    sql`select (${sql.join(clauses, sql` or `)}) as referenced`,
  );
  return Boolean(result.rows[0]?.referenced);
}

export type CleanupResult = { deleted: string[]; kept: string[]; failed: string[] };

/**
 * Delete each key that nothing references any more.
 *
 * **Cleanup must never be the reason a save or a delete fails.** Storage errors
 * are collected and returned, never thrown: an orphaned object is a far smaller
 * problem than a 500 on the screen that triggered it.
 */
export async function deleteUnreferenced(
  keys: Iterable<string | null | undefined>,
  { budgetMs = CLEANUP_BUDGET_MS }: { budgetMs?: number } = {},
): Promise<CleanupResult> {
  const pending = [...new Set([...keys].filter((key): key is string => Boolean(key)))].sort();
  const result: CleanupResult = { deleted: [], kept: [], failed: [] };
  const deadline = Date.now() + budgetMs;

  for (const [index, key] of pending.entries()) {
    if (Date.now() >= deadline) {
      console.warn(
        `Storage cleanup budget of ${budgetMs}ms exhausted; leaving ${pending.length - index} file(s) orphaned rather than running past the gateway timeout:`,
        pending.slice(index),
      );
      result.failed.push(...pending.slice(index));
      return result;
    }

    if (await isReferenced(key)) {
      result.kept.push(key);
      continue;
    }

    try {
      await deleteObject(key);
      /*
       * And the row that named it. `media_asset` is the registry of stored
       * files; a row whose object is gone is a listing for something that no
       * longer exists -- it would show in the admin's gallery as a broken
       * image, and `mediaIdForKey` would hand it back for a re-upload of the
       * same bytes instead of registering the new object.
       *
       * After the object, not before: if the delete fails the file is still
       * there and the row is still true.
       */
      await db.delete(mediaAsset).where(eq(mediaAsset.storageKey, key));
      result.deleted.push(key);
    } catch (error) {
      console.warn(`Could not delete unreferenced file "${key}":`, error);
      result.failed.push(key);
    }
  }

  return result;
}
