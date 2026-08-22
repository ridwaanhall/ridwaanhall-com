import "server-only";

import { sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

import { deleteObject } from "@/lib/storage/objects";
import { db } from "@/lib/db/client";
import {
  aboutOrganization,
  aboutProfile,
  blogBlogimage,
  blogBlogpost,
  projectsProjectimage,
} from "@/lib/db/schema";

/**
 * Remove a stored file once nothing points at it any more.
 *
 * A port of `apps/core/file_cleanup.py`. **Reference counting is not defensive
 * here, it is load-bearing**, and the live data says so plainly: the author
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
 * Every column in the database that holds a storage key.
 *
 * Django found these by walking `apps.get_models()` for `FileField`s. There is
 * no equivalent reflection over a Drizzle schema, so they are listed -- and a
 * column added without being listed here would leak its files silently, which
 * is why `scripts/check-storage.mjs` counts them against the schema.
 */
export const FILE_COLUMNS: PgColumn[] = [
  aboutProfile.image,
  aboutOrganization.logo,
  blogBlogpost.authorImage,
  blogBlogimage.image,
  projectsProjectimage.image,
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
 * One statement rather than one per column. Django could afford five queries
 * because it ran beside its database; every round trip here crosses the network
 * to Supabase, and this runs once per file in a cascade.
 */
export async function isReferenced(key: string): Promise<boolean> {
  // An empty key is nothing to delete. Reporting it as referenced is what stops
  // a caller treating "no file" as "an orphan to clean up".
  if (!key) return true;

  const clauses = FILE_COLUMNS.map(
    (column) => sql`exists (select 1 from ${column.table} where ${column} = ${key})`,
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
      result.deleted.push(key);
    } catch (error) {
      console.warn(`Could not delete unreferenced file "${key}":`, error);
      result.failed.push(key);
    }
  }

  return result;
}
