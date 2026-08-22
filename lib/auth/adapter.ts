import { and, eq } from "drizzle-orm";
import type { Adapter, AdapterAccount, AdapterUser } from "next-auth/adapters";

import { uniqueUsername, usernameCandidates } from "@/lib/auth/username";
import { db } from "@/lib/db/client";
import { account, accountIdentity, guestProfile } from "@/lib/db/app-schema";
import { isUuid } from "@/lib/utils/uuid";

/**
 * An Auth.js adapter over the site's own account tables.
 *
 * A sign-in reads and writes `app.account`, `app.account_identity` and
 * `app.guest_profile`. It was `auth_user`, `socialaccount_socialaccount` and
 * `guestbook_userprofile` -- allauth's tables, kept verbatim so Django and this
 * could authenticate the same 37 people against the same rows during the port.
 * The name is left as it is: what it implements is still allauth's behaviour,
 * and the reasons below are still allauth's reasons.
 *
 * What went with the rename is Django's own bookkeeping. There is no
 * `password` column to fill with an unusable placeholder, no `is_superuser`
 * beside `is_staff`, and no `content_type`/`permission` rows behind either --
 * this application has one privilege, and it is `is_staff`.
 *
 * **Sessions are JWTs, so this implements no session methods.** Django keeps
 * its sessions in `django_session` as a signed, Django-serialised blob that
 * Auth.js cannot read or write, and there is nothing to be gained by inventing
 * a third session table for a stack that is being retired. Auth.js still calls
 * this for every user and account operation.
 *
 * Two things allauth does that this deliberately does not:
 *
 * - **No `account_emailaddress` row.** The live table holds 2 rows against 37
 *   users, so it is not part of this site's flow -- `ACCOUNT_EMAIL_VERIFICATION`
 *   is `"none"` and nothing reads it. Writing rows there would be a new
 *   behaviour rather than a port, and its two partial unique indexes
 *   (`unique_verified_email`, `unique_primary_email`) would turn an unrelated
 *   conflict into a failed sign-in.
 * - **No account linking by email.** `ACCOUNT_UNIQUE_EMAIL` defaults on and
 *   `SOCIALACCOUNT_EMAIL_AUTHENTICATION` is unset, so allauth refuses to attach
 *   a second provider to an existing address by itself. Auth.js's default is
 *   the same refusal (`OAuthAccountNotLinked`), which is why
 *   `allowDangerousEmailAccountLinking` is not set on either provider.
 */

function now(): string {
  return new Date().toISOString();
}

/**
 * A display name in two columns.
 *
 * The 150-character limit is Django's `varchar(150)`; the columns are plain
 * `text` now, but the cap stays -- it is what the stored 37 rows were written
 * under, and nothing wants an unbounded name from a provider.
 */
function splitName(name: string | null | undefined): { firstName: string; lastName: string } {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  return {
    firstName: parts[0].slice(0, 150),
    lastName: parts.slice(1).join(" ").slice(0, 150),
  };
}

function toAdapterUser(row: {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}): AdapterUser {
  const named = `${row.firstName} ${row.lastName}`.trim();
  return {
    // Auth.js ids are strings and so are these. They were `integer`, and every
    // crossing of that boundary went through a `Number(...)` -- each of which
    // now reads a uuid as `NaN`, so all of them are gone.
    id: row.id,
    email: row.email,
    name: named || row.username,
    // Nothing consumes this: there is no email provider, so Auth.js never
    // checks it. Django's verification state lives in `account_emailaddress`,
    // which this does not touch.
    emailVerified: null,
    image: null,
  };
}

const USER_COLUMNS = {
  id: account.id,
  username: account.username,
  email: account.email,
  firstName: account.firstName,
  lastName: account.lastName,
};

/**
 * Just the four verbs this file uses, so a drizzle transaction satisfies it as
 * readily as the pooled connection does.
 *
 * That is the whole reason the connection is a parameter: every operation here
 * writes to the *live* Supabase database, and `scripts/check-auth-adapter.mjs`
 * exercises them for real inside a transaction it then rolls back. Testing
 * against a stub would only prove the stub agrees with itself -- the things
 * worth checking are Django's own constraints (`username` unique, `password`
 * and the name columns `NOT NULL`, the `(provider, uid)` unique pair), and only
 * Postgres can enforce those.
 */
type Database = Pick<typeof db, "select" | "insert" | "update" | "delete">;

export function DjangoAdapter(database: Database = db): Adapter {
  const usernameTaken = async (username: string): Promise<boolean> => {
    const rows = await database
      .select({ id: account.id })
      .from(account)
      .where(eq(account.username, username))
      .limit(1);
    return rows.length > 0;
  };

  return {
    async createUser(user) {
      const { firstName, lastName } = splitName(user.name);

      /*
       * The provider's own handle, when it has one.
       *
       * Auth.js normalises every provider's profile down to id/name/email/
       * image, so GitHub's `login` -- which allauth used verbatim, and which is
       * why `Harindrawahyu` is stored with its capital -- is not in `user` at
       * all. `auth.ts` puts it back on the profile as `handle`.
       */
      const handle = (user as AdapterUser & { handle?: string }).handle;

      const username = await uniqueUsername(
        usernameCandidates({ handle, name: user.name, email: user.email }),
        usernameTaken,
      );

      const [created] = await database
        .insert(account)
        .values({
          username,
          email: user.email ?? "",
          firstName,
          lastName,
          isStaff: false,
          isActive: true,
          joinedAt: now(),
          lastSeenAt: null,
        })
        .returning(USER_COLUMNS);

      /*
       * The profile row Django's `post_save` receiver would have created.
       *
       * Without it the guestbook falls back to `is_staff` for `is_author`,
       * which is the right degradation but the wrong state -- and the admin
       * screen that grants co-author edits this row, so it has to exist before
       * anyone can be promoted.
       */
      await database.insert(guestProfile).values({
        accountId: created.id,
        isAuthor: false,
        isCoAuthor: false,
        coAuthorOrder: 0,
        createdAt: now(),
      });

      return toAdapterUser(created);
    },

    async getUser(id) {
      // A malformed key is "no such user", and has to be answered before it
      // reaches a query: a uuid column compared against one raises `22P02`
      // rather than matching nothing.
      if (!isUuid(id)) return null;
      const [row] = await database.select(USER_COLUMNS).from(account).where(eq(account.id, id));
      return row ? toAdapterUser(row) : null;
    },

    async getUserByEmail(email) {
      // `email` carries no unique constraint, so this can legitimately match
      // more than one row. The oldest wins: that is the account the person has
      // had longest. It was "lowest id", which said the same thing only while
      // ids were handed out in order.
      const [row] = await database
        .select(USER_COLUMNS)
        .from(account)
        .where(eq(account.email, email))
        .orderBy(account.joinedAt)
        .limit(1);
      return row ? toAdapterUser(row) : null;
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const [row] = await database
        .select(USER_COLUMNS)
        .from(account)
        .innerJoin(accountIdentity, eq(accountIdentity.accountId, account.id))
        .where(
          and(
            eq(accountIdentity.provider, provider),
            eq(accountIdentity.providerUid, providerAccountId),
          ),
        )
        .limit(1);
      return row ? toAdapterUser(row) : null;
    },

    async updateUser(user) {
      const patch: Partial<typeof account.$inferInsert> = {};
      if (user.email !== undefined && user.email !== null) patch.email = user.email;
      if (user.name !== undefined) Object.assign(patch, splitName(user.name));

      if (Object.keys(patch).length === 0) {
        const [row] = await database.select(USER_COLUMNS).from(account).where(eq(account.id, user.id));
        return toAdapterUser(row);
      }

      const [row] = await database
        .update(account)
        .set(patch)
        .where(eq(account.id, user.id))
        .returning(USER_COLUMNS);
      return toAdapterUser(row);
    },

    /*
     * Named `link` rather than `account`, which is the identity's own table
     * here -- shadowing it would leave every query in this method pointing at
     * whatever Auth.js passed in.
     */
    async linkAccount(link) {
      const accountId = link.userId;
      /*
       * `extra` is the raw provider profile, which is what allauth stored and
       * what `lib/auth/profile.ts` reads back for the display name and the
       * avatar -- Google's `name`/`picture`, GitHub's `login`/`avatar_url`.
       * Auth.js hands the whole profile through on `account.extra_data`; see
       * the `account` callback in `auth.ts`.
       *
       * On conflict the row is refreshed rather than skipped: the profile is
       * how someone's avatar and display name stay current.
       */
      const extra = (link as AdapterAccount & { extra_data?: unknown }).extra_data ?? {};

      await database
        .insert(accountIdentity)
        .values({
          provider: link.provider,
          providerUid: link.providerAccountId,
          accountId,
          extra,
          connectedAt: now(),
        })
        .onConflictDoUpdate({
          target: [accountIdentity.provider, accountIdentity.providerUid],
          set: { extra, accountId },
        });

      await database.update(account).set({ lastSeenAt: now() }).where(eq(account.id, accountId));
    },

    async unlinkAccount({ provider, providerAccountId }) {
      await database
        .delete(accountIdentity)
        .where(
          and(
            eq(accountIdentity.provider, provider),
            eq(accountIdentity.providerUid, providerAccountId),
          ),
        );
    },

    async deleteUser(id) {
      /*
       * Every dependent row cascades -- messages, comments, the profile, the
       * identities. In Postgres, and for real: Django declared `CASCADE` in
       * Python and left `NO ACTION` in the database, so this statement used to
       * depend on the application having cleared the children first.
       */
      if (!isUuid(id)) return;
      await database.delete(account).where(eq(account.id, id));
    },
  };
}

/**
 * Refresh `last_seen_at` on a sign-in that created nothing.
 *
 * `linkAccount` only runs the first time a provider is attached, so a
 * returning user would otherwise keep the timestamp of the day they joined --
 * which is what Django's `user_logged_in` receiver kept current.
 */
export async function touchLogin(
  accountId: string,
  provider: string,
  uid: string,
  extra: unknown,
  database: Database = db,
) {
  if (!isUuid(accountId)) return;
  await Promise.all([
    database.update(account).set({ lastSeenAt: now() }).where(eq(account.id, accountId)),
    /*
     * Only the profile. The identity had a `last_login` of its own, which was
     * allauth's and said the same thing as the account's for every row it ever
     * wrote -- one person, one provider each. `account.last_seen_at` is the one
     * place that answer lives now.
     */
    extra
      ? database
          .update(accountIdentity)
          .set({ extra })
          .where(
            and(eq(accountIdentity.provider, provider), eq(accountIdentity.providerUid, uid)),
          )
      : Promise.resolve(),
  ]);
}

