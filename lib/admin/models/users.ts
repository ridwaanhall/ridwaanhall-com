import { joined, lookupOr } from "@/lib/admin/sql";
import { accountIdentity, account, guestProfile } from "@/lib/db/app-schema";

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

/**
 * Which provider or providers this account signs in with.
 *
 * From `account_identity`, which is where the answer actually lives: an
 * account *is* a provider identity here, and the row that says which is the one
 * the adapter wrote at the first sign-in. Nothing on `account` records it, so
 * before this the two kinds of account were indistinguishable on the screen
 * whose whole subject is who can get in.
 *
 * `joined` rather than `lookup`, so an account that ever holds two identities
 * shows both. It holds one today -- a provider offering an address another
 * account already uses is refused rather than linked, which is written up in
 * SECURITY.md -- and that is exactly why the single-row version would have
 * looked right for as long as it took somebody to change that.
 *
 * Stored lower case (`google`, `github`) because that is what Auth.js passes;
 * the display casing is applied where it is rendered, never in the column, so
 * matching and searching stay on the stored form.
 */
const providers = joined(accountIdentity.provider, accountIdentity.accountId, account.id);

/**
 * `google` -> `Google`. Presentation only, and the filter's options.
 *
 * One constant for both, because a filter offering a value the column never
 * renders -- or a column rendering a value the filter cannot select -- is the
 * pair that drifts. **Adding a provider to `auth.ts` means adding a line
 * here**; nothing derives this from the Auth.js config, because that module is
 * the server's and this descriptor is read by the check harnesses.
 */
const PROVIDER_LABELS: Record<string, string> = { google: "Google", github: "GitHub" };

const providerLabel = (value: string) =>
  value
    .split(", ")
    .filter(Boolean)
    // An unknown provider prints its own name rather than vanishing: a row this
    // map has no entry for is a provider somebody has just added, and a blank
    // cell would read as an account with no way in at all.
    .map((name) => PROVIDER_LABELS[name] ?? name)
    .join(", ");

/** The two guestbook flags, which live on a separate row from the account. */
const isAuthor = lookupOr(guestProfile.isAuthor, guestProfile.accountId, account.id, false);
const isCoAuthor = lookupOr(guestProfile.isCoAuthor, guestProfile.accountId, account.id, false);

export type UserRow = {
  id: string;
  username: string;
  email: string;
  isStaff: boolean;
  isSuperuser: boolean;
  providers: string;
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
    providers,
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
      key: "provider",
      label: "Signed in with",
      sort: providers,
      // A dash rather than an empty cell: an account with no identity row is a
      // real and broken state -- nobody can sign into it -- and blank would
      // read as a rendering fault rather than as the answer.
      value: (row) => providerLabel(row.providers) || "—",
    },
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
    /*
     * Options written out, because the column is an expression: `"distinct"`
     * and the related lookup both select *from* the column's table, and a
     * `string_agg` has none. `lib/admin/list.ts` splits those two shapes into
     * separate members of `ListFilter` so this is a type error rather than a
     * query that fails at runtime.
     *
     * Matching is on the aggregate, so an account holding two identities would
     * be its own value ("github, google") rather than matching either. That is
     * honest for a filter over a joined string, and no such row exists today --
     * a provider offering an address another account already uses is refused
     * rather than linked.
     */
    {
      key: "provider",
      label: "Signed in with",
      kind: "choice",
      column: providers,
      choices: Object.entries(PROVIDER_LABELS).map(([value, label]) => ({ value, label })),
    },
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
      help: "Set by the provider at sign-in. Changing any of these here would not change what the provider sends back.",
      fields: [
        { name: "username", column: account.username, label: "Username", kind: "text", readOnly: true },
        { name: "email", column: account.email, label: "Email", kind: "email", readOnly: true },
        /*
         * Which provider this person signs in with, read from
         * `account_identity` through `display` rather than from a column on
         * this table -- there is none. `display` is the load path only; a write
         * still goes to `column`, which is why the field is `readOnly` and why
         * `column` names the primary key: it has to point at something, and
         * pointing at the key is the one choice that cannot be mistaken for a
         * writable field.
         */
        {
          name: "providers",
          column: account.id,
          display: providers,
          label: "Signed in with",
          kind: "text",
          readOnly: true,
          help: "Google or GitHub, from the identity the provider handed back. An account is that identity; there is no password here to change.",
        },
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
        /*
         * Shown, never written here. Read-only fields are dropped from the
         * insert and the update by `toColumns`, so this is a display of the
         * flag and not a second place to set it -- the Access screen owns it,
         * because whoever can set it can grant themselves everything.
         *
         * It is on the form rather than only on the list because `validate`
         * below needs it: a rule about whether the record outranks the person
         * editing it can only read what the form loaded.
         */
        {
          name: "isSuperuser",
          column: account.isSuperuser,
          label: "Superuser",
          kind: "checkbox",
          readOnly: true,
          help: "Every screen and every action. Set on the Access screen, which is also where this account's per-screen grants live.",
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
  validate: async (values, { id, actorId, actorIsSuperuser }) => {
    /*
     * A superuser is always staff, and this is the one form that could say
     * otherwise.
     *
     * `is_superuser` is read-only here, so its value arrives loaded from the
     * row rather than from the reader -- but `is_staff` is a live checkbox
     * beside it, and unticking it would write the pair the database refuses
     * (`account_superuser_is_staff`). Caught here so the answer is a sentence
     * on the form rather than a check violation to translate afterwards.
     *
     * Refused to *everybody*, superuser included: the rule is about the shape
     * of an account, not about who outranks whom, and the way to make somebody
     * not-staff is to take the role away first, on the screen that grants it.
     */
    if (values.isSuperuser && !values.isStaff) {
      return "A superuser is always staff. Remove the superuser role on the Access screen first.";
    }

    if (id === actorId) {
      if (!values.isStaff) return "You cannot remove your own staff access.";
      if (!values.isActive) return "You cannot deactivate your own account.";
      return null;
    }

    /*
     * A superuser's way in is not something a grant on this screen may take.
     *
     * `is_superuser` is not editable here, so nobody can promote themselves --
     * but `is_staff` and `is_active` are, and `getStaffUser` requires both of a
     * superuser exactly as it does of anyone else. So an account granted
     * change-on-Users could clear either flag on the superuser and lock the one
     * role that can grant it back out of the admin, with SQL the only way in.
     *
     * The grant genuinely means "decides who may reach this admin" -- that is
     * the screen's own blurb -- so this does not refuse the power, it refuses
     * *outranking*: a superuser may still do it to another superuser.
     */
    if (values.isSuperuser && !actorIsSuperuser && (!values.isStaff || !values.isActive)) {
      return "Only a superuser can take away a superuser's access.";
    }
    return null;
  },
};
