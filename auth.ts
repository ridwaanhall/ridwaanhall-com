import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

import { DjangoAdapter, touchLogin } from "@/lib/auth/adapter";
import { isUuid } from "@/lib/utils/uuid";

/**
 * Auth.js v5 over Django's existing accounts.
 *
 * The two providers and their scopes are the ones `SOCIALACCOUNT_PROVIDERS` in
 * `FlexForge/settings.py` declares -- Google `profile email` with
 * `access_type=online`, GitHub `user:email` -- so the consent screen a returning
 * reader sees asks for exactly what it always did, and no re-consent is
 * triggered by the migration.
 *
 * **`allowDangerousEmailAccountLinking` is deliberately not set.** allauth runs
 * with `ACCOUNT_UNIQUE_EMAIL` on and `SOCIALACCOUNT_EMAIL_AUTHENTICATION` unset,
 * so it refuses to attach a second provider to an address that already belongs
 * to an account; Auth.js's default refusal (`OAuthAccountNotLinked`) is the same
 * rule. Turning it on would silently merge two identities on an unverified
 * claim.
 *
 * **Sessions are JWTs.** `django_session` holds a Django-serialised, Django-
 * signed blob that Auth.js can neither read nor write, and inventing a third
 * session table for a stack being retired at cutover buys nothing. The token
 * carries identity only -- `is_author` and `is_co_author` are read from the
 * database at the point of use (`lib/auth/profile.ts`), because a thirty-day
 * token must not be the authority on who may delete other people's messages.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DjangoAdapter(),
  session: { strategy: "jwt" },
  trustHost: true,

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: { scope: "openid profile email", access_type: "online" },
      },
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      authorization: { params: { scope: "user:email" } },
      /*
       * `login` is GitHub's own handle and is what allauth wrote into
       * `auth_user.username` verbatim -- it is why `Harindrawahyu` is stored
       * with its capital rather than slugified. Auth.js's default profile
       * mapping throws it away, so it is carried through here as `handle` for
       * the adapter's `createUser` to use.
       */
      profile(profile) {
        return {
          id: String(profile.id),
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
          handle: profile.login,
        };
      },
    }),
  ],

  callbacks: {
    /**
     * `token.sub` is the account's key, and the only place it is checked.
     *
     * It was `auth_user.id`, an integer as a string. Keys are uuids now, and
     * sessions are **thirty-day JWTs** -- so every reader signed in before the
     * schema moved is still presenting a token asserting `sub: "1"`, and will
     * be for a month. That subject names no row, and worse, it is not even a
     * well-formed key: a `uuid` column compared against it raises
     * `22P02 invalid input syntax for type uuid`, which surfaced as a console
     * error on the sidebar's admin link and would have surfaced as a 500 on the
     * first server action such a reader submitted.
     *
     * A token whose subject is not a uuid is one this application can no longer
     * identify anybody by, so it does not become a signed-in session. The
     * reader is signed out and signs in again, which mints a token carrying
     * their real key. Done here rather than at each of the six places that read
     * `session.user.id`, because this is the one place a token becomes a
     * session -- and because a guard on each of those would leave the token
     * itself in circulation, half-trusted.
     */
    session({ session, token }) {
      if (token.sub && isUuid(token.sub)) session.user.id = token.sub;
      return session;
    },
  },

  events: {
    /*
     * Keep `extra_data` and `last_login` current on every sign-in.
     *
     * This is where the provider profile actually lands, rather than in the
     * adapter's `linkAccount`: that runs only the first time a provider is
     * attached, and Auth.js does not hand it the profile. Doing it here covers
     * the returning reader too, which is what allauth's `user_logged_in`
     * receiver did -- and it is how someone's avatar and display name stay up
     * to date, since `lib/auth/profile.ts` reads both out of `extra_data`.
     *
     * A failure is logged and swallowed. An out-of-date avatar is not worth
     * failing a sign-in over.
     */
    async signIn({ user, account, profile }) {
      if (!account || !user.id) return;
      try {
        await touchLogin(
          user.id,
          account.provider,
          account.providerAccountId,
          profile ?? null,
        );
      } catch (error) {
        console.error("Could not refresh social profile on sign-in:", error);
      }
    },
  },

  pages: {
    // Django sent readers straight to the provider (`SOCIALACCOUNT_LOGIN_ON_GET`)
    // and back to the guestbook afterwards, so there was never an Auth.js-style
    // provider-picker page. Both of these point at the guestbook so a failed or
    // cancelled sign-in lands where it started rather than on a generic page.
    signIn: "/guestbook",
    error: "/guestbook",
  },
});
