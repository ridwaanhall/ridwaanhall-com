import { eq, or, sql } from "drizzle-orm";

import { account, adminAccess } from "@/lib/db/app-schema";

import type { AdminListModel } from "@/lib/admin/list";

/**
 * The access screen's list: who can reach this admin, and how much of it.
 *
 * **A list descriptor with no form beside it**, which is the only one here.
 * Everything else in `lib/admin/models/` declares both, and the record page is
 * `record-form.tsx` rendering the second. This model's record page is a
 * *matrix* -- one row per registry entry, four checkboxes each -- and the rows
 * are screens rather than columns of a table, so there is no form descriptor
 * that could describe it. `app/admin/access/[id]/` draws it instead, and the
 * registry entry carries `custom: true` so the checks know to expect that
 * rather than a missing descriptor.
 *
 * It reads `account`, which the Users screen also reads, and the two are not
 * the same list: this one is the people who can get in. `baseWhere` is what
 * makes that difference part of the screen rather than a filter somebody can
 * clear -- see `lib/admin/list.ts`.
 *
 * An inactive staff account is still listed. Its grants are exactly what it
 * would have if the account were switched back on, which is the thing you want
 * to look at before switching it back on.
 */

export type AccessRow = {
  id: string;
  username: string;
  email: string;
  isSuperuser: boolean;
  isActive: boolean;
  screens: number;
  lastSeenAt: string | null;
};

/**
 * How many screens this account can open.
 *
 * `can_view` rather than a count of rows: a row with all four flags false is
 * stored -- unticking the last box does not delete it -- so counting rows would
 * report an account with no access at all as having thirty-five screens. And
 * `view` is the one flag the others imply, so it is the honest single number.
 *
 * A superuser's number does not come from this table at all; the column below
 * says so in words rather than printing a zero that would read as "no access"
 * for the one account that has all of it.
 */
const screens = sql<number>`(
  select count(*)::int from ${adminAccess}
  where ${adminAccess.accountId} = ${account.id} and ${adminAccess.canView}
)`;

export const accessList: AdminListModel<AccessRow> = {
  key: "access",
  from: account,
  pk: account.id,
  select: {
    id: account.id,
    username: account.username,
    email: account.email,
    isSuperuser: account.isSuperuser,
    isActive: account.isActive,
    screens,
    lastSeenAt: account.lastSeenAt,
  },
  /*
   * Staff or superuser. `or` rather than `is_staff` alone because the two flags
   * are independent columns and nothing in the database ties them: an account
   * marked superuser with the staff flag cleared cannot sign into the admin,
   * and is exactly the row somebody needs to find in order to fix it. A screen
   * about access that hides the broken case is not much use.
   */
  baseWhere: or(eq(account.isStaff, true), eq(account.isSuperuser, true)),
  columns: [
    { key: "username", label: "Username", sort: account.username, value: (row) => row.username },
    { key: "email", label: "Email", kind: "muted", sort: account.email, value: (row) => row.email },
    {
      key: "is_superuser",
      label: "Superuser",
      kind: "bool",
      sort: account.isSuperuser,
      value: (row) => row.isSuperuser,
    },
    {
      key: "screens",
      label: "Screens",
      sort: screens,
      // Not `kind: "number"`: a superuser's access is not a count, and printing
      // one would be wrong in both directions -- zero reads as locked out, and
      // the total reads as a grant set somebody could edit away.
      value: (row) => (row.isSuperuser ? "all" : String(row.screens)),
    },
    {
      key: "is_active",
      label: "Active",
      kind: "bool",
      sort: account.isActive,
      value: (row) => row.isActive,
    },
    {
      key: "last_login",
      label: "Last seen",
      kind: "datetime",
      sort: account.lastSeenAt,
      value: (row) => row.lastSeenAt,
    },
  ],
  filters: [
    { key: "is_superuser", label: "Superuser", kind: "boolean", column: account.isSuperuser },
    { key: "is_active", label: "Active", kind: "boolean", column: account.isActive },
  ],
  search: {
    fields: [account.username, account.email, account.firstName, account.lastName],
    placeholder: "Search username, email or name",
  },
  defaultSort: { key: "username", dir: "asc" },
  rowId: (row) => row.id,
};

/** One account, as the matrix page's header needs it. Not a changelist query. */
export const accessAccountSelect = {
  id: account.id,
  username: account.username,
  email: account.email,
  firstName: account.firstName,
  lastName: account.lastName,
  isStaff: account.isStaff,
  isSuperuser: account.isSuperuser,
  isActive: account.isActive,
};
