"use server";

import { signIn, signOut } from "@/auth";

/**
 * Sign-in and sign-out as server actions.
 *
 * Auth.js v5's recommended shape, and it avoids pulling `next-auth/react` --
 * and therefore a `<SessionProvider>` -- into a site that reads its session on
 * the server everywhere else. `signIn` redirects to the provider, which is what
 * Django's `SOCIALACCOUNT_LOGIN_ON_GET` did: no provider-picker page in
 * between.
 */
export async function signInWith(provider: "google" | "github") {
  await signIn(provider, { redirectTo: "/guestbook/" });
}

export async function signOutFromGuestbook() {
  await signOut({ redirectTo: "/guestbook/" });
}
