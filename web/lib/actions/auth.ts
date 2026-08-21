"use server";

import { signIn, signOut } from "@/auth";

/**
 * Sign-in and sign-out as server actions.
 *
 * Auth.js v5's recommended shape, and it avoids pulling `next-auth/react` --
 * and therefore a `<SessionProvider>` -- into a site that reads its session on
 * the server everywhere else. `signIn` redirects straight to the provider,
 * which is what Django's `SOCIALACCOUNT_LOGIN_ON_GET` did: no provider-picker
 * page in between.
 *
 * **`redirectTo` is sanitised, not trusted.** It comes from the browser, and
 * Auth.js hands it to a redirect. Django validated the same value with
 * `url_has_allowed_host_and_scheme` because a redirect sink fed from a request
 * is an open redirect otherwise -- `//evil.com`, `/\evil.com` and
 * `https:/evil.com` all read as same-site to a naive check and as another
 * origin to a browser. Only a plain same-site path is accepted here; anything
 * else falls back to the guestbook.
 */
const FALLBACK = "/guestbook/";

function samePath(target: string | undefined): string {
  if (!target || !target.startsWith("/")) return FALLBACK;
  // A second leading `/` or `\` makes it protocol-relative, i.e. another host.
  if (/^\/[/\\]/.test(target)) return FALLBACK;
  return target;
}

export async function signInWith(provider: "google" | "github", redirectTo?: string) {
  await signIn(provider, { redirectTo: samePath(redirectTo) });
}

export async function signOutHere(redirectTo?: string) {
  await signOut({ redirectTo: samePath(redirectTo) });
}
