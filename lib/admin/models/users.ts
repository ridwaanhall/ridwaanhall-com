import { lookupOr } from "@/lib/admin/sql";
import { account, guestProfile } from "@/lib/db/app-schema";

import type { AdminFormModel } from "@/lib/admin/form";
import type { AdminListModel } from "@/lib/admin/list";

/**
 * The accounts screen.
 *
 * Built to what the accounts are actually *for* here: who may reach this admin,
 * and who is credited as an author on the guestbook. Those are the only two
 * questions this screen answers.
 *
 * **There is no password management, and there should not be.** Every account
 * comes from a Google or GitHub sign-in, so there is no credential here to
 * change, reset, or leak.
 *
 * **The staff and active flags live here; the superuser flag and the grants do
 * not.** They are on the Access screen instead, and that is one field one home
 * rather than tidiness: `is_superuser` decides who may edit grants at all, so
 * a form that any account with `change` on Users could reach would be a way to
 * promote yourself. Splitting them also keeps the two questions apart -- this
 * screen answers who exists and who gets in, that one answers what they may do
 * once they are in.
 *
 * The superuser flag is still *shown* here, as a read-only column, because a
 * list of accounts that does not say which of them can do everything is a list
 * missing the thing you look at it for.
 */

/** The two guestbook flags, which live on a separate row from the account. */
const isAuthor = lookupOr(guestProfile.isAuthor, guestProfile.accountId, account.id, false);
const isCoAuthor = lookupOr(guestProfile.isCoAuthor, guestProfile.accountId, account.id, false);

export type UserRow = {
  id: string;
  username: string;
  email: string;
  isStaff: boolean;
  isSuperuser: boolean;
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
    isSuperuser: account.isSuperuser,
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
    // Read-only here by construction: a changelist column is a column. It is
    // edited on the Access screen, which is also where its grants are.
    {
      key: "is_superuser",
      label: "Superuser",
      kind: "bool",
      sort: account.isSuperuser,
      value: (row) => row.isSuperuser,
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
    { key: "is_superuser", label: "Superuser", kind: "boolean", column: account.isSuperuser },
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
  /*
   * Never created here, and deleted only by a superuser.
   *
   * **Create is refused to everybody, including a superuser**, and that is not
   * caution: an account is created by a sign-in and by nothing else. The
   * adapter writes one the first time a provider hands back an identity, so the
   * account *is* that identity. A row made by hand is one no provider will ever
   * hand an identity back for -- an account nobody can sign in to, which is not
   * a thing a stronger role should be able to make either.
   *
   * **Delete is `"superuser"`**, where it used to be refused outright. The
   * reason it was refused has not changed -- deleting one cascades through
   * every comment and guestbook message that person wrote -- but that is a
   * question of consequence rather than of possibility, and refusing it to
   * everybody meant an account could only be removed by hand in SQL, which is
   * strictly worse: no confirmation, no warning, no record of the cascade.
   * `deleteWarning` below is what the dialog says before it happens.
   *
   * The flag is read through `permits`, never as `canDelete !== false` -- see
   * `lib/auth/permissions.ts`, where the truthy-string hazard is written up.
   */
  canCreate: false,
  canDelete: "superuser",
  deleteWarning:
    "Every comment and guestbook message this person wrote is deleted with the account, along with their sign-in. Nothing here can recreate it: they would have to sign in again, as a new account.",
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
   * load -- and every account here is OAuth, so there is no password to sign
   * back in with. There are other staff accounts, but relying on one of them
   * being available is not a guard.
   *
   * The same rule is written again on the Access screen for `is_superuser` and
   * the grants. Twice rather than once because they are two forms writing two
   * tables, and the shared thing between them is the sentence, not the code.
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
