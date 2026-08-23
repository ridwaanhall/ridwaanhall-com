import { eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { account, accountIdentity, guestProfile } from "@/lib/db/app-schema";

/**
 * Who a signed-in reader is, as the guestbook and comments need them.
 *
 * The display name and avatar do not live on the account row at all. They are
 * read from the stored provider profile on `account_identity.extra`, which is
 * the raw payload the provider returned:
 *
 *   google  { sub, name, picture, email, email_verified, given_name, ... }
 *   github  { id, login, name, avatar_url, email, ... }
 *
 * Google wins when both are linked, which is the order the original walked.
 *
 * **The permission flags are read here, from the database, and never carried
 * in the session token.** `is_author` and `is_co_author` decide who may pin
 * and delete, and a JWT the reader holds for thirty days must not be the
 * authority on that -- revoking co-author would not take effect until their
 * token expired. The token carries identity; this carries permission.
 */
export type UserProfile = {
  /** A uuid; see drizzle/0005. */
  id: string;
  username: string;
  fullName: string;
  email: string;
  profileImage: string | null;
  isAuthor: boolean;
  isCoAuthor: boolean;
  coAuthorOrder: number;
  /** `is_author || is_co_author` -- the single source of truth for pinning. */
  canPin: boolean;
};

const GRAVATAR_FALLBACK = "https://www.gravatar.com/avatar/";

type ExtraData = Record<string, unknown>;

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Derive name, avatar and email from the linked social accounts.
 *
 * Exported so `getUserProfiles` and the adapter can share one rule; the
 * original had this inline and the guestbook and the sign-in path would
 * otherwise disagree about what a user is called.
 */
export function fromSocialAccounts(
  accounts: { provider: string; extraData: unknown }[],
  fallback: { fullName: string; username: string; email: string },
): { fullName: string; email: string; profileImage: string | null } {
  const byProvider = new Map<string, ExtraData>();
  for (const account of accounts) {
    if (account.extraData && typeof account.extraData === "object") {
      byProvider.set(account.provider, account.extraData as ExtraData);
    }
  }

  const google = byProvider.get("google");
  if (google) {
    const name = str(google.name);
    return {
      // Falls back to the username, not to the stored first/last name: those
      // are written once at sign-up and go stale, the username does not.
      fullName: name || fallback.username,
      profileImage: str(google.picture) || GRAVATAR_FALLBACK,
      email: str(google.email) || fallback.email,
    };
  }

  const github = byProvider.get("github");
  if (github) {
    const name = str(github.name) || str(github.login);
    return {
      fullName: name || fallback.fullName,
      profileImage: str(github.avatar_url) || GRAVATAR_FALLBACK,
      email: fallback.email,
    };
  }

  return { fullName: fallback.fullName, profileImage: null, email: fallback.email };
}

/**
 * Load profiles for a set of user ids in three queries rather than three per
 * user.
 *
 * The guestbook renders fifty messages at a time and each needs its author's
 * name, avatar and badge. One query for all of them, not one per message.
 */
export async function getUserProfiles(
  userIds: string[],
  // Injectable for the same reason the adapter's connection is: the check
  // scripts drive these against the live schema inside a rolled-back
  // transaction, and rows written there are invisible to the pool.
  database: Pick<typeof db, "select"> = db,
): Promise<Map<string, UserProfile>> {
  const ids = [...new Set(userIds)];
  const result = new Map<string, UserProfile>();
  if (ids.length === 0) return result;

  const [users, socials, profiles] = await Promise.all([
    database
      .select({
        id: account.id,
        username: account.username,
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        isStaff: account.isStaff,
      })
      .from(account)
      .where(inArray(account.id, ids)),
    database
      .select({
        userId: accountIdentity.accountId,
        provider: accountIdentity.provider,
        extraData: accountIdentity.extra,
      })
      .from(accountIdentity)
      .where(inArray(accountIdentity.accountId, ids)),
    database
      .select({
        userId: guestProfile.accountId,
        isAuthor: guestProfile.isAuthor,
        isCoAuthor: guestProfile.isCoAuthor,
        coAuthorOrder: guestProfile.coAuthorOrder,
      })
      .from(guestProfile)
      .where(inArray(guestProfile.accountId, ids)),
  ]);

  const socialsByUser = new Map<string, { provider: string; extraData: unknown }[]>();
  for (const social of socials) {
    const list = socialsByUser.get(social.userId) ?? [];
    list.push({ provider: social.provider, extraData: social.extraData });
    socialsByUser.set(social.userId, list);
  }
  const profileByUser = new Map(profiles.map((profile) => [profile.userId, profile]));

  for (const user of users) {
    const stored = profileByUser.get(user.id);
    // No `guest_profile` row falls back to `is_staff`. Every account gets one
    // at sign-up, but a read path must not crash on a row that is missing.
    const isAuthor = stored ? stored.isAuthor : user.isStaff;
    const isCoAuthor = stored ? stored.isCoAuthor : false;

    const named = `${user.firstName} ${user.lastName}`.trim();
    const derived = fromSocialAccounts(socialsByUser.get(user.id) ?? [], {
      fullName: named || user.username,
      username: user.username,
      email: user.email,
    });

    result.set(user.id, {
      id: user.id,
      username: user.username,
      fullName: derived.fullName,
      email: derived.email,
      profileImage: derived.profileImage,
      isAuthor,
      isCoAuthor,
      coAuthorOrder: isCoAuthor && stored ? stored.coAuthorOrder : 0,
      canPin: isAuthor || isCoAuthor,
    });
  }

  return result;
}

/** One user's profile, or `null` if there is no such row. */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  return (await getUserProfiles([userId])).get(userId) ?? null;
}

/** Whether a `guestbook_userprofile` row exists, used by the adapter. */
export async function hasStoredProfile(userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: guestProfile.id })
    .from(guestProfile)
    .where(eq(guestProfile.accountId, userId))
    .limit(1);
  return rows.length > 0;
}
