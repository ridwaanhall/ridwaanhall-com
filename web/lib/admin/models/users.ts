import { lookupOr } from "@/lib/admin/sql";
import { authUser, guestbookUserprofile } from "@/lib/db/schema";

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
 * Groups and per-model permissions are likewise not built: there are zero
 * `auth_group` rows and every staff account is a superuser, so the matrix would
 * be a screen with nothing to say.
 */

/** The two guestbook flags, which live on a separate row from the account. */
const isAuthor = lookupOr(guestbookUserprofile.isAuthor, guestbookUserprofile.userId, authUser.id, false);
const isCoAuthor = lookupOr(
  guestbookUserprofile.isCoAuthor,
  guestbookUserprofile.userId,
  authUser.id,
  false,
);

export type UserRow = {
  id: number;
  username: string;
  email: string;
  isStaff: boolean;
  isAuthor: boolean;
  isCoAuthor: boolean;
  lastLogin: string | null;
};

export const userList: AdminListModel<UserRow> = {
  key: "user",
  from: authUser,
  pk: authUser.id,
  select: {
    id: authUser.id,
    username: authUser.username,
    email: authUser.email,
    isStaff: authUser.isStaff,
    isAuthor,
    isCoAuthor,
    lastLogin: authUser.lastLogin,
  },
  columns: [
    // Stored by two different rules and both are load-bearing: a provider handle
    // is taken verbatim (which is why `Harindrawahyu` keeps its capital) and
    // everything else is slugified lowercase. See `lib/auth/username.ts`.
    { key: "username", label: "Username", sort: authUser.username, value: (row) => row.username },
    { key: "email", label: "Email", kind: "muted", sort: authUser.email, value: (row) => row.email },
    {
      key: "is_staff",
      label: "Staff",
      kind: "bool",
      sort: authUser.isStaff,
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
      sort: authUser.lastLogin,
      value: (row) => row.lastLogin,
    },
  ],
  filters: [
    // `is_staff` is what `lib/auth/staff.ts` reads on every admin request, so
    // this filter answers "who can see this page" directly.
    { key: "is_staff", label: "Staff", kind: "boolean", column: authUser.isStaff },
    { key: "is_active", label: "Active", kind: "boolean", column: authUser.isActive },
    { key: "is_author", label: "Author", kind: "boolean", column: isAuthor },
    { key: "is_co_author", label: "Co-author", kind: "boolean", column: isCoAuthor },
  ],
  search: {
    fields: [authUser.username, authUser.email, authUser.firstName, authUser.lastName],
    placeholder: "Search username, email or name",
  },
  defaultSort: { key: "username", dir: "asc" },
  rowId: (row) => row.id,
};
