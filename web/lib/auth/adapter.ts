import { randomBytes } from "node:crypto";

import { and, eq } from "drizzle-orm";
import type { Adapter, AdapterAccount, AdapterUser } from "next-auth/adapters";

import { uniqueUsername, usernameCandidates } from "@/lib/auth/username";
import { db } from "@/lib/db/client";
import { authUser, guestbookUserprofile, socialaccountSocialaccount } from "@/lib/db/schema";

/**
 * An Auth.js adapter over Django's own tables.
 *
 * No new tables. A sign-in reads and writes `auth_user`,
 * `socialaccount_socialaccount` and `guestbook_userprofile` exactly as allauth
 * did, so the 37 accounts already there keep working, Django keeps working
 * until the cutover, and `guestbook_chatmessage.user_id` -- a live foreign key
 * to `auth_user` -- never points at a row this wrote differently.
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

/**
 * Django's "unusable password": `!` followed by 40 random characters.
 *
 * `auth_user.password` is `NOT NULL`, and every one of the 37 live rows is
 * exactly this shape (41 chars, leading `!`). Django reads the `!` prefix as
 * "this account cannot log in with a password", which is the correct state for
 * a social-only account -- writing an empty string instead would leave an
 * account that Django's own `check_password` treats as merely mismatched.
 */
function unusablePassword(): string {
  return `!${randomBytes(30).toString("base64url").slice(0, 40)}`;
}

function now(): string {
  return new Date().toISOString();
}

/** Django's `first_name`/`last_name` are `varchar(150) NOT NULL`. */
function splitName(name: string | null | undefined): { firstName: string; lastName: string } {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  return {
    firstName: parts[0].slice(0, 150),
    lastName: parts.slice(1).join(" ").slice(0, 150),
  };
}

function toAdapterUser(row: {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}): AdapterUser {
  const named = `${row.firstName} ${row.lastName}`.trim();
  return {
    // Auth.js ids are strings; Django's are `integer`. Every crossing of that
    // boundary goes through here or `Number(...)` below, nowhere else.
    id: String(row.id),
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
  id: authUser.id,
  username: authUser.username,
  email: authUser.email,
  firstName: authUser.firstName,
  lastName: authUser.lastName,
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
      .select({ id: authUser.id })
      .from(authUser)
      .where(eq(authUser.username, username))
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
        .insert(authUser)
        .values({
          username,
          email: user.email ?? "",
          firstName,
          lastName,
          password: unusablePassword(),
          isSuperuser: false,
          isStaff: false,
          isActive: true,
          dateJoined: now(),
          lastLogin: null,
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
      await database.insert(guestbookUserprofile).values({
        userId: created.id,
        isAuthor: false,
        isCoAuthor: false,
        coAuthorOrder: 0,
        createdAt: now(),
      });

      return toAdapterUser(created);
    },

    async getUser(id) {
      const numeric = Number(id);
      if (!Number.isInteger(numeric)) return null;
      const [row] = await database.select(USER_COLUMNS).from(authUser).where(eq(authUser.id, numeric));
      return row ? toAdapterUser(row) : null;
    },

    async getUserByEmail(email) {
      // `auth_user.email` carries no unique constraint in Django, so this can
      // legitimately match more than one row. Lowest id wins: that is the
      // account the person has had longest.
      const [row] = await database
        .select(USER_COLUMNS)
        .from(authUser)
        .where(eq(authUser.email, email))
        .orderBy(authUser.id)
        .limit(1);
      return row ? toAdapterUser(row) : null;
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const [row] = await database
        .select(USER_COLUMNS)
        .from(authUser)
        .innerJoin(
          socialaccountSocialaccount,
          eq(socialaccountSocialaccount.userId, authUser.id),
        )
        .where(
          and(
            eq(socialaccountSocialaccount.provider, provider),
            eq(socialaccountSocialaccount.uid, providerAccountId),
          ),
        )
        .limit(1);
      return row ? toAdapterUser(row) : null;
    },

    async updateUser(user) {
      const numeric = Number(user.id);
      const patch: Partial<typeof authUser.$inferInsert> = {};
      if (user.email !== undefined && user.email !== null) patch.email = user.email;
      if (user.name !== undefined) Object.assign(patch, splitName(user.name));

      if (Object.keys(patch).length === 0) {
        const [row] = await database.select(USER_COLUMNS).from(authUser).where(eq(authUser.id, numeric));
        return toAdapterUser(row);
      }

      const [row] = await database
        .update(authUser)
        .set(patch)
        .where(eq(authUser.id, numeric))
        .returning(USER_COLUMNS);
      return toAdapterUser(row);
    },

    async linkAccount(account) {
      const userId = Number(account.userId);
      /*
       * `extra_data` is the raw provider profile, which is what allauth stored
       * and what `lib/auth/profile.ts` reads back for the display name and the
       * avatar -- Google's `name`/`picture`, GitHub's `login`/`avatar_url`.
       * Auth.js hands the whole profile through on `account.extra_data`; see
       * the `account` callback in `auth.ts`.
       *
       * On conflict the row is refreshed rather than skipped: the profile is
       * how someone's avatar and display name stay current, and `last_login`
       * is what it is for.
       */
      const extraData =
        (account as AdapterAccount & { extra_data?: unknown }).extra_data ?? {};

      await database
        .insert(socialaccountSocialaccount)
        .values({
          provider: account.provider,
          uid: account.providerAccountId,
          userId,
          extraData,
          dateJoined: now(),
          lastLogin: now(),
        })
        .onConflictDoUpdate({
          target: [socialaccountSocialaccount.provider, socialaccountSocialaccount.uid],
          set: { extraData, lastLogin: now(), userId },
        });

      await database.update(authUser).set({ lastLogin: now() }).where(eq(authUser.id, userId));
    },

    async unlinkAccount({ provider, providerAccountId }) {
      await database
        .delete(socialaccountSocialaccount)
        .where(
          and(
            eq(socialaccountSocialaccount.provider, provider),
            eq(socialaccountSocialaccount.uid, providerAccountId),
          ),
        );
    },

    async deleteUser(id) {
      // Every dependent row cascades in Postgres exactly as Django declared it
      // -- messages, comments, the profile, the social accounts.
      await database.delete(authUser).where(eq(authUser.id, Number(id)));
    },
  };
}

/**
 * Refresh `last_login` on a sign-in that created nothing.
 *
 * `linkAccount` only runs the first time a provider is attached, so a
 * returning user would otherwise keep the timestamp of the day they joined --
 * which is what Django's `user_logged_in` receiver kept current.
 */
export async function touchLogin(
  userId: number,
  provider: string,
  uid: string,
  extraData: unknown,
  database: Database = db,
) {
  await Promise.all([
    database.update(authUser).set({ lastLogin: now() }).where(eq(authUser.id, userId)),
    database
      .update(socialaccountSocialaccount)
      .set({ lastLogin: now(), ...(extraData ? { extraData } : {}) })
      .where(
        and(
          eq(socialaccountSocialaccount.provider, provider),
          eq(socialaccountSocialaccount.uid, uid),
        ),
      ),
  ]);
}

