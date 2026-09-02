import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import { ADMIN_ENTRIES } from "@/lib/admin/registry";
import { grantableEntries } from "@/lib/auth/permissions";
import {
  DEFAULT_STAFF_PRESET,
  grantsForPreset,
  presetByKey,
  type AccessPreset,
} from "@/lib/auth/presets";
import { db } from "@/lib/db/client";
import { adminAccess } from "@/lib/db/app-schema";
import { isUuid } from "@/lib/utils/uuid";

/**
 * The grant rows behind a preset, written.
 *
 * `lib/auth/presets.ts` decides what a preset *means* and stays pure so the
 * browser and the check scripts can read it; this is the half that touches the
 * database, and it is the only place a grant row is written outside the Access
 * screen's own action.
 */

/** Screens a preset may name. Anything else is not a grant this can express. */
const GRANTABLE_KEYS = new Set(grantableEntries(ADMIN_ENTRIES).map((entry) => entry.key));

/** Whether the account already has grant rows of its own, of any shape. */
async function hasGrants(accountId: string): Promise<boolean> {
  const [counted] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(adminAccess)
    .where(
      and(
        eq(adminAccess.accountId, accountId),
        // Rows naming screens the registry no longer has do not count as an
        // answer: an account whose only rows are dead keys reaches nothing, and
        // is exactly the account this exists for.
        inArray(adminAccess.modelKey, [...GRANTABLE_KEYS]),
      ),
    );
  return (counted?.total ?? 0) > 0;
}

/**
 * Give an account a preset's screens, and only if it has none.
 *
 * The empty state is the problem this solves. Before per-screen grants,
 * `is_staff` was the whole permission and setting it was the whole act; now an
 * account can be flagged staff, sign in, and land on an admin whose rail draws
 * no groups at all -- which does not read as "you have not been given anything
 * yet", it reads as a broken deployment.
 *
 * **Never a widening.** The check is "no rows", not "no grant for this screen":
 * an account somebody narrowed to one screen on purpose has rows, so this
 * leaves it alone, and so does an account whose every box was unticked (the
 * Access screen keeps those rows rather than deleting them, precisely so the
 * difference between "narrowed to nothing" and "never set up" survives).
 *
 * `onConflictDoNothing` on top of that, because two saves racing on the same
 * new account would otherwise raise on the unique key and turn a successful
 * save into an error.
 */
export async function seedGrants(accountId: string, preset: AccessPreset): Promise<void> {
  if (!isUuid(accountId)) return;
  if (await hasGrants(accountId)) return;

  const grants = grantsForPreset(preset);
  const rows = Object.entries(grants)
    // Only what the preset actually reaches. A row of four falses is a row the
    // Access screen writes when somebody clears one deliberately, and writing
    // them here would make this account indistinguishable from that one.
    .filter(([, grant]) => grant.view || grant.add || grant.change || grant.delete)
    .map(([modelKey, grant]) => ({
      accountId,
      modelKey,
      canView: grant.view,
      canAdd: grant.add,
      canChange: grant.change,
      canDelete: grant.delete,
    }));

  if (rows.length === 0) return;

  await db
    .insert(adminAccess)
    .values(rows)
    .onConflictDoNothing({ target: [adminAccess.accountId, adminAccess.modelKey] });
}

/** The same, on the preset a new staff account starts from. */
export async function seedDefaultGrants(accountId: string): Promise<void> {
  const preset = presetByKey(DEFAULT_STAFF_PRESET);
  if (!preset) return;
  await seedGrants(accountId, preset);
}
