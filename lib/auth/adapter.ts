import { and, eq } from "drizzle-orm";
import type { Adapter, AdapterAccount, AdapterUser } from "next-auth/adapters";

import { uniqueUsername, usernameCandidates } from "@/lib/auth/username";
import { db } from "@/lib/db/client";
import { account, accountIdentity, publicAccess } from "@/lib/db/app-schema";
import { isUuid } from "@/lib/utils/uuid";

/**
 * An Auth.js adapter over the site's own account tables.
 *
 * A sign-in reads and writes `app.account`, `app.account_identity` and
 * `app.public_access` -- three tables this application owns, rather than the
 * shape Auth.js's stock adapters expect. Writing the adapter is what lets the
 * schema stay the one the rest of the site reads.
 *
 * There is one privilege here and it is `is_staff`. No password column, no
 * superuser flag beside it, no permission rows behind either: everyone signs in
 * through Google or GitHub, so there is no credential for this application to
 * store or to leak.
 *
 * **Sessions are JWTs, so this implements no session methods.** Nothing is
 * persisted per session; the token carries identity and the database is asked
 * about privileges on every request. Auth.js still calls this adapter for every
 * user and account operation.
 *
 * Two things it deliberately does not do:
 *
 * - **No separate email-address table.** Addresses are not verified separately
 *   from the provider that vouched for them -- the provider has already done
 *   it -- so an account's email lives on the account and nowhere else.
 * - **No account linking by email.** Signing in with GitHub using the address
 *   an existing Google account holds does not silently take over that account:
 *   Auth.js refuses with `OAuthAccountNotLinked`, which is why
 *   `allowDangerousEmailAccountLinking` is not set on either provider. An
 *   address is a claim by whichever provider asserted it, and treating two
 *   providers' claims as one identity is how account takeover works.
 */

function now(): string {
  return new Date().toISOString();
}

/**
 * A display name in two columns.
 *
 * The columns are plain `text`, but a 150-character cap stays on each half.
 * A display name arrives from a provider and nothing about it is bounded at
 * the source, so the bound is applied here rather than discovered later.
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
    // checks it. An address is verified by whichever provider vouched for it,
    // and that happened before the sign-in reached us.
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
 * worth checking are the database's own constraints -- `username` unique, the
 * name columns `NOT NULL`, the `(provider, uid)` pair unique -- and only
 * Postgres can enforce those.
 */
type Database = Pick<typeof db, "select" | "insert" | "update" | "delete">;

export function accountAdapter(database: Database = db): Adapter {
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
       * image, so GitHub's `login` -- the handle someone chose, capitals and
       * all -- is not in `user` at all. `auth.ts` puts it back on the profile
       * as `handle`, because it is the best username candidate available.
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
       * The public-access row, created with the account rather than lazily.
       *
       * Both columns default to true, so `getUserProfiles` reads a missing row
       * and a default row alike and nothing depends on this having run. It runs
       * anyway because the Public access screen edits *rows*: without one there
       * is nothing to switch, and an account nobody can restrict is a gap that
       * only shows up the day somebody needs to.
       */
      await database.insert(publicAccess).values({
        accountId: created.id,
        canComment: true,
        canGuestbook: true,
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
       * `extra` is the raw provider profile, which `lib/auth/profile.ts`
       * reads back for the display name and the avatar -- Google's
       * `name`/`picture`, GitHub's `login`/`avatar_url`.
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
       * identities -- and it cascades in Postgres, declared on the foreign keys
       * in `drizzle/0000_init.sql`. This statement does not depend on the
       * application having remembered to clear the children first.
       */
      if (!isUuid(id)) return;
      await database.delete(account).where(eq(account.id, id));
    },
  };
}

/**
 * Refresh `last_seen_at` on a sign-in that created nothing.
 *
 * `linkAccount` only runs the first time a provider is attached, so without
 * this a returning reader would keep the timestamp of the day they joined for
 * ever.
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
     * Only the profile. `account.last_seen_at` is the single place that answer
     * lives: a second timestamp on the identity would say the same thing for
     * everyone who signs in with one provider, and disagree with itself for
     * anyone who uses two.
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

