import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

import { accountAdapter, touchLogin } from "@/lib/auth/adapter";
import { isUuid } from "@/lib/utils/uuid";

/**
 * Auth.js v5 over the site's own account tables.
 *
 * Two providers, each asking for the least it can: Google `profile email` with
 * `access_type=online` (no refresh token, because nothing here acts on anyone's
 * behalf while they are away), GitHub `user:email`. A consent screen that asks
 * for more than the site uses is a consent screen people are right to decline.
 *
 * **`allowDangerousEmailAccountLinking` is deliberately not set.** Auth.js
 * refuses by default to attach a provider to an address that already belongs to
 * an account (`OAuthAccountNotLinked`), and that refusal is correct: turning it
 * on merges two identities on the strength of an email claim, which is exactly
 * the move an attacker makes.
 *
 * **Sessions are JWTs.** Nothing is stored per session; the token
 * carries identity only -- the role and the two public switches are read from
 * the database at the point of use (`lib/auth/profile.ts`), because a
 * thirty-day token must not be the authority on who may delete other people's
 * messages, or on whether somebody may still post at all.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: accountAdapter(),
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
       * `login` is the handle someone actually chose on GitHub, capitals and
       * all, and it is the best username candidate available. Auth.js's default
       * profile mapping throws it away, so it is carried through here as
       * `handle` for the adapter's `createUser` to use.
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
     * It used to be an integer key rendered as a string. Keys are uuids now,
     * and
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
     * the returning reader too -- and it is how someone's avatar and display
     * name stay up to date, since `lib/auth/profile.ts` reads both out of
     * `extra_data`.
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
    /*
     * Both point at the site's own sign-in page.
     *
     * They pointed at the guestbook, because that was the only surface with
     * both provider buttons on it -- there was no sign-in page to name. The
     * cost was invisible and total: the guestbook reads no search params at
     * all, so every `?error=` Auth.js delivered there was silently dropped and
     * a refused sign-in was indistinguishable from one that never happened.
     * `/sign-in` renders them.
     *
     * The admin does not use either. Its gate is rendered by
     * `app/admin/layout.tsx` in place of the admin itself, and signs people
     * back in to `/admin` rather than to the home page.
     */
    signIn: "/sign-in",
    error: "/sign-in",
  },
});
