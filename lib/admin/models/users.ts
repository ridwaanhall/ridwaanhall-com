import { lookupOr } from "@/lib/admin/sql";
import { account, guestProfile } from "@/lib/db/app-schema";

import type { AdminFormModel } from "@/lib/admin/form";
import type { AdminListModel } from "@/lib/admin/list";

/**
 * The accounts screen.
 *
 * This has no counterpart in `apps/*<!-- -->/admin.py`: Django never registered
 * `auth_user` itself, it just inherited `django.contrib.auth`'s `UserAdmin`. So
 * this is built to what the accounts are actually *for* here rather than to a
 * `list_display` -- who may reach this admin, and who is credited as an author
 * on the guestbook.
 *
 * **There is no password management, and there should not be.** Every account is
 * created by allauth or Auth.js from a Google or GitHub sign-in;
 * `auth_user.password` holds an unusable hash and nothing reads it. Django's
 * `UserAdmin` offered a password form because it assumed local accounts.
 *
 * Groups and per-model permissions are likewise not built, and no longer
 * exist: `drizzle/0005` dropped them along with the password hash and the
 * superuser flag. There were zero groups, 152 permissions nothing consulted,
 * and every staff account flagged superuser -- a matrix with nothing to say.
 */

/** The two guestbook flags, which live on a separate row from the account. */
const isAuthor = lookupOr(guestProfile.isAuthor, guestProfile.accountId, account.id, false);
const isCoAuthor = lookupOr(guestProfile.isCoAuthor, guestProfile.accountId, account.id, false);

export type UserRow = {
  id: string;
  username: string;
  email: string;
  isStaff: boolean;
  isAuthor: boolean;
  isCoAuthor: boolean;
  lastSeenAt: string | null;
};

export const userList: AdminListModel<UserRow> = {
  key: "user",
  from: account,
  pk: account.id,
  select: {
    id: account.id,
    username: account.username,
    email: account.email,
    isStaff: account.isStaff,
    isAuthor,
    isCoAuthor,
    lastSeenAt: account.lastSeenAt,
  },
  columns: [
    // Stored by two different rules and both are load-bearing: a provider handle
    // is taken verbatim (which is why `Harindrawahyu` keeps its capital) and
    // everything else is slugified lowercase. See `lib/auth/username.ts`.
    { key: "username", label: "Username", sort: account.username, value: (row) => row.username },
    { key: "email", label: "Email", kind: "muted", sort: account.email, value: (row) => row.email },
    {
      key: "is_staff",
      label: "Staff",
      kind: "bool",
      sort: account.isStaff,
      value: (row) => row.isStaff,
    },
    { key: "is_author", label: "Author", kind: "bool", sort: isAuthor, value: (row) => row.isAuthor },
    {
      key: "is_co_author",
      label: "Co-author",
      kind: "bool",
      sort: isCoAuthor,
      value: (row) => row.isCoAuthor,
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
    // `is_staff` is what `lib/auth/staff.ts` reads on every admin request, so
    // this filter answers "who can see this page" directly.
    { key: "is_staff", label: "Staff", kind: "boolean", column: account.isStaff },
    { key: "is_active", label: "Active", kind: "boolean", column: account.isActive },
    { key: "is_author", label: "Author", kind: "boolean", column: isAuthor },
    { key: "is_co_author", label: "Co-author", kind: "boolean", column: isCoAuthor },
  ],
  search: {
    fields: [account.username, account.email, account.firstName, account.lastName],
    placeholder: "Search username, email or name",
  },
  defaultSort: { key: "username", dir: "asc" },
  rowId: (row) => row.id,
};

export const userForm: AdminFormModel = {
  key: "user",
  from: account,
  pk: account.id,
  label: (values) => String(values.username ?? "Account"),
  // Accounts are created by a sign-in and by nothing else: the adapter writes
  // one the first time a provider hands back an identity. Deleting one would
  // cascade through their messages and comments, which is a data loss no
  // checkbox should be able to cause -- and there is no re-registration flow to
  // undo it, since the account *is* the provider identity.
  canCreate: false,
  canDelete: false,
  fieldsets: [
    {
      title: "Identity",
      help: "Set by the provider at sign-in. Changing either here would not change what the provider sends back.",
      fields: [
        { name: "username", column: account.username, label: "Username", kind: "text", readOnly: true },
        { name: "email", column: account.email, label: "Email", kind: "email", readOnly: true },
      ],
    },
    {
      title: "Access",
      fields: [
        {
          name: "isStaff",
          column: account.isStaff,
          label: "Staff",
          kind: "checkbox",
          help: "Grants this admin. Read from the database on every request, so clearing it takes effect at once.",
        },
        {
          name: "isActive",
          column: account.isActive,
          label: "Active",
          kind: "checkbox",
          help: "An inactive account cannot sign in, and cannot reach this admin even as staff.",
        },
      ],
    },
  ],
  /*
   * You cannot lock yourself out.
   *
   * `staffGate` requires `is_active AND is_staff`, both read fresh per request,
   * so clearing either on your own account takes effect on the very next page
   * load -- with no password to sign back in with, since every account is
   * OAuth. Django's `UserAdmin` allowed exactly this and it is a known way to
   * lose an admin; there are three other staff accounts here, but relying on
   * that is not a guard.
   *
   * The author and co-author flags are edited on User profiles, not here: they
   * live on a different table, and giving one field two homes is how the two
   * drift.
   */
  validate: async (values, { id, actorId }) => {
    if (id !== actorId) return null;
    if (!values.isStaff) return "You cannot remove your own staff access.";
    if (!values.isActive) return "You cannot deactivate your own account.";
    return null;
  },
};
