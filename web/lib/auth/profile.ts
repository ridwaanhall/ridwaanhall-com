import { eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { authUser, guestbookUserprofile, socialaccountSocialaccount } from "@/lib/db/schema";

/**
 * Who a signed-in reader is, as the guestbook and comments need them.
 *
 * A port of `UserProfileMixin.get_user_profile_data` in `apps/guestbook/
 * views.py`. The display name and avatar do not live on `auth_user` at all --
 * allauth keeps them in `socialaccount.extra_data`, whose shape is the raw
 * provider profile:
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
  id: number;
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
      // The original fell back to the *username* here, not to the Django
      // first/last name, when Google sent no `name`.
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
 * name, avatar and badge; Django solved the same N+1 with
 * `prefetch_related("socialaccount_set", "userprofile")`.
 */
export async function getUserProfiles(userIds: number[]): Promise<Map<number, UserProfile>> {
  const ids = [...new Set(userIds)];
  const result = new Map<number, UserProfile>();
  if (ids.length === 0) return result;

  const [users, socials, profiles] = await Promise.all([
    db
      .select({
        id: authUser.id,
        username: authUser.username,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
        email: authUser.email,
        isStaff: authUser.isStaff,
      })
      .from(authUser)
      .where(inArray(authUser.id, ids)),
    db
      .select({
        userId: socialaccountSocialaccount.userId,
        provider: socialaccountSocialaccount.provider,
        extraData: socialaccountSocialaccount.extraData,
      })
      .from(socialaccountSocialaccount)
      .where(inArray(socialaccountSocialaccount.userId, ids)),
    db
      .select({
        userId: guestbookUserprofile.userId,
        isAuthor: guestbookUserprofile.isAuthor,
        isCoAuthor: guestbookUserprofile.isCoAuthor,
        coAuthorOrder: guestbookUserprofile.coAuthorOrder,
      })
      .from(guestbookUserprofile)
      .where(inArray(guestbookUserprofile.userId, ids)),
  ]);

  const socialsByUser = new Map<number, { provider: string; extraData: unknown }[]>();
  for (const social of socials) {
    const list = socialsByUser.get(social.userId) ?? [];
    list.push({ provider: social.provider, extraData: social.extraData });
    socialsByUser.set(social.userId, list);
  }
  const profileByUser = new Map(profiles.map((profile) => [profile.userId, profile]));

  for (const user of users) {
    const stored = profileByUser.get(user.id);
    // No `guestbook_userprofile` row falls back to `is_staff`, as the original
    // did -- every live user has one, but the row is created by a Django
    // signal and this must not crash if one is ever missing.
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
export async function getUserProfile(userId: number): Promise<UserProfile | null> {
  return (await getUserProfiles([userId])).get(userId) ?? null;
}

/** Whether a `guestbook_userprofile` row exists, used by the adapter. */
export async function hasStoredProfile(userId: number): Promise<boolean> {
  const rows = await db
    .select({ id: guestbookUserprofile.id })
    .from(guestbookUserprofile)
    .where(eq(guestbookUserprofile.userId, userId))
    .limit(1);
  return rows.length > 0;
}
