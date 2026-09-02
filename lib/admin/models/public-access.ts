import { lookupOr } from "@/lib/admin/sql";
import { username, userEmail } from "@/lib/admin/models/guestbook";
import { ROLE_LABEL } from "@/lib/auth/roles";
import { account, publicAccess } from "@/lib/db/app-schema";

import type { AdminFormModel } from "@/lib/admin/form";
import type { AdminListModel } from "@/lib/admin/list";

/**
 * What each account may do on the public site.
 *
 * The other half of the Access group. `/admin/access` says what a *staff*
 * account may open inside this admin, one row per screen; this says whether an
 * account may still post outside it, one row per account -- and it lists every
 * account rather than only the staff ones, because the thing it governs is what
 * everybody has.
 *
 * It replaced `user-profile`, which edited `guest_profile.is_author` and
 * `is_co_author`. Those were a second role system on a second table, and they
 * folded into `is_staff` and `is_superuser`; what the screen edits now is the
 * thing the public site never had at all. Before this, posting a comment or a
 * guestbook message was gated on "is there a session" and nothing else, so the
 * only way to stop one person was to delete their account and take every
 * comment they had ever written with it.
 *
 * **An ordinary descriptor, not a matrix.** The access screen is custom because
 * its rows are registry entries and its cells are four booleans on a join row;
 * two switches on one row per account is exactly what the generic changelist
 * and form already draw, so it draws them.
 */

/** The role, as one word, from the two flags on the account. */
const accountRole = lookupOr<boolean>(account.isSuperuser, account.id, publicAccess.accountId, false);
const accountStaff = lookupOr<boolean>(account.isStaff, account.id, publicAccess.accountId, false);
const accountActive = lookupOr<boolean>(account.isActive, account.id, publicAccess.accountId, true);

export type PublicAccessRow = {
  id: string;
  user: string;
  isSuperuser: boolean;
  isStaff: boolean;
  isActive: boolean;
  canComment: boolean;
  canGuestbook: boolean;
};

const accessUser = username(publicAccess.accountId);

export const publicAccessList: AdminListModel<PublicAccessRow> = {
  key: "public-access",
  from: publicAccess,
  pk: publicAccess.id,
  select: {
    id: publicAccess.id,
    user: accessUser,
    isSuperuser: accountRole,
    isStaff: accountStaff,
    isActive: accountActive,
    canComment: publicAccess.canComment,
    canGuestbook: publicAccess.canGuestbook,
  },
  columns: [
    { key: "user", label: "User", sort: accessUser, value: (row) => row.user },
    {
      key: "role",
      label: "Role",
      kind: "muted",
      // Sorted by the flag that decides it rather than by the word: the label
      // is editorial and the column is not, which is the rule the whole admin
      // keeps -- match on what a row carries, render what a reader reads.
      sort: accountRole,
      value: (row) =>
        ROLE_LABEL[row.isSuperuser ? "superuser" : row.isStaff ? "staff" : "public"],
    },
    {
      key: "can_comment",
      label: "Comment",
      kind: "bool",
      sort: publicAccess.canComment,
      value: (row) => row.canComment,
    },
    {
      key: "can_guestbook",
      label: "Guestbook",
      kind: "bool",
      sort: publicAccess.canGuestbook,
      value: (row) => row.canGuestbook,
    },
    {
      // Not editable here -- it is set on Users, and it is shown because it
      // overrides both switches: an inactive account posts nothing whatever
      // these say, so a row reading "Comment: yes, Active: no" is the honest
      // picture rather than a contradiction.
      key: "is_active",
      label: "Active",
      kind: "bool",
      sort: accountActive,
      value: (row) => row.isActive,
    },
  ],
  filters: [
    { key: "can_comment", label: "Comment", kind: "boolean", column: publicAccess.canComment },
    { key: "can_guestbook", label: "Guestbook", kind: "boolean", column: publicAccess.canGuestbook },
    { key: "is_superuser", label: "Superuser", kind: "boolean", column: accountRole },
    { key: "is_staff", label: "Staff", kind: "boolean", column: accountStaff },
    { key: "is_active", label: "Active", kind: "boolean", column: accountActive },
  ],
  search: {
    // Username and email both live on the account, so both are subqueries
    // against the same related row.
    fields: [accessUser, userEmail(publicAccess.accountId)],
    placeholder: "Search username or email",
  },
  defaultSort: { key: "user", dir: "asc" },
  rowId: (row) => row.id,
};

export const publicAccessForm: AdminFormModel = {
  key: "public-access",
  from: publicAccess,
  pk: publicAccess.id,
  label: (values) => String(values.user ?? "Account"),
  /*
   * Neither created nor deleted here, and for the same reason `user` refuses
   * create: the row is made by a sign-in, one per account, and one made here
   * would belong to nobody. Deleting one is the more interesting refusal --
   * both columns default to true, so removing a row silently restores full
   * access, which is a permission change wearing the clothes of a tidy-up.
   *
   * That also means nothing here can lock somebody out by accident: the worst
   * this screen does is untick two boxes, and the boxes are what it is for.
   */
  canCreate: false,
  canDelete: false,
  fieldsets: [
    {
      fields: [
        {
          name: "user",
          column: publicAccess.accountId,
          display: accessUser,
          label: "Account",
          kind: "reference",
          required: true,
          readOnly: "afterCreate",
          reference: { table: account, value: account.id, label: account.username },
        },
        {
          name: "canComment",
          column: publicAccess.canComment,
          label: "May comment",
          kind: "checkbox",
          help: "Post comments on blog posts and projects. Deleting their own is always allowed.",
        },
        {
          name: "canGuestbook",
          column: publicAccess.canGuestbook,
          label: "May post to the guestbook",
          kind: "checkbox",
          help: "Write in the guestbook, and reply to somebody there.",
        },
      ],
    },
  ],
};
