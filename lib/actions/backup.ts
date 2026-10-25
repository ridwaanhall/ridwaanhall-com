"use server";

import { updateTag } from "next/cache";

import { getStaffUser } from "@/lib/auth/staff";
import { restoreBackup } from "@/lib/backup/core";
import { RESTORE_CONFIRMATION } from "@/lib/backup/order";
import { TAGS } from "@/lib/data/tags";
import { pool } from "@/lib/db/client";

export type RestoreState = { ok: true; tables: number; rows: number } | { ok: false; error: string } | null;

/**
 * Replace every row with an uploaded backup's. Superuser only, asked here
 * because a server action does not nest under the admin layout.
 *
 * Then every public tag is expired: the restored rows are whatever the file
 * says, and a cached page built from the old ones would go on saying
 * something else for days.
 */
export async function restoreFromUpload(_previous: RestoreState, form: FormData): Promise<RestoreState> {
  const user = await getStaffUser();
  if (!user?.isSuperuser) return { ok: false, error: "Only a superuser can restore a backup." };

  if (String(form.get("confirm") ?? "").trim() !== RESTORE_CONFIRMATION) {
    return { ok: false, error: `Type ${RESTORE_CONFIRMATION} to confirm. Nothing was changed.` };
  }
  const file = form.get("backup");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a backup file. Nothing was changed." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    return { ok: false, error: "That file is not JSON. Nothing was changed." };
  }

  const client = await pool.connect();
  try {
    const result = await restoreBackup(client, parsed);
    if (!result.ok) return { ok: false, error: `${result.error} Nothing was changed.` };
    for (const tag of Object.values(TAGS)) updateTag(tag);
    const counts = Object.values(result.restored);
    return { ok: true, tables: counts.length, rows: counts.reduce((sum, n) => sum + n, 0) };
  } finally {
    client.release();
  }
}
