import { backupFileName, exportBackup } from "@/lib/backup/core";
import { fail, handle } from "@/lib/api/response";
import { getStaffUser } from "@/lib/auth/staff";
import { pool } from "@/lib/db/client";

/**
 * Download every row of the database as one JSON file. Superuser only.
 *
 * A route handler does not nest under the admin layout, so it asks the gate
 * itself -- the layout trap in the root `CLAUDE.md`. Not-found rather than
 * forbidden, for the same reason the Access screen answers that way: a staff
 * account without the role is not told the endpoint exists.
 *
 * The file holds every account's email and identity, which is why it is the
 * superuser's and nobody else's.
 */
export const GET = handle(async () => {
  const user = await getStaffUser();
  if (!user?.isSuperuser) return fail("Not found", 404);

  const client = await pool.connect();
  try {
    const backup = await exportBackup(client);
    return new Response(JSON.stringify(backup), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${backupFileName()}"`,
        "Cache-Control": "no-store",
      },
    });
  } finally {
    client.release();
  }
});
