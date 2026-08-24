"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { signIn, signOut } from "@/auth";

/**
 * Sign-in and sign-out as server actions.
 *
 * Auth.js v5's recommended shape, and it avoids pulling `next-auth/react` --
 * and therefore a `<SessionProvider>` -- into a site that reads its session on
 * the server everywhere else. `signIn` redirects straight to the provider:
 * every surface that offers it has already asked which one, so a
 * provider-picker page in between would ask a question that has just been
 * answered.
 *
 * **`redirectTo` is sanitised, not trusted.** It comes from the browser and is
 * handed to a redirect, so an unchecked value is an open redirect --
 * `//evil.com`, `/\evil.com` and `https:/evil.com` all read as same-site to a
 * naive check and as another origin to a browser. Only a plain same-site path
 * is accepted; anything else falls back to the guestbook.
 */
const FALLBACK = "/guestbook" as Route;

function samePath(target: string | undefined): Route {
  if (!target || !target.startsWith("/")) return FALLBACK;
  // A second leading `/` or `\` makes it protocol-relative, i.e. another host.
  if (/^\/[/\\]/.test(target)) return FALLBACK;
  // A runtime-checked path cannot be a `Route` literal, and `typedRoutes`
  // is right to say so. The check above is what stands in for the type.
  return target as Route;
}

export async function signInWith(provider: "google" | "github", redirectTo?: string) {
  // Auth.js keeps this redirect: it goes to the provider, which is another
  // origin and its URL to build. The sign-out below is the opposite case.
  await signIn(provider, { redirectTo: samePath(redirectTo) });
}

/**
 * End the session, then go somewhere on this site.
 *
 * **The redirect is ours, and it is relative.** `signOut({ redirectTo })` does
 * both halves itself, and the URL it redirects to is absolute -- built from
 * `AUTH_URL` by `createActionURL`, which prefers that variable over the origin
 * the request actually arrived on, unconditionally. So the browser is sent to
 * whatever host that variable names rather than the one it is browsing, and an
 * absolute URL is a different navigation class from a relative one. Signing out
 * of the admin looked like it did nothing for exactly that reason: the action
 * ran, the redirect fired, and the session survived.
 *
 * `redirect: false` skips only that. next-auth writes the delete-cookies onto
 * the cookie jar *before* it consults the flag, so the session is still ended
 * here -- what is left is a plain same-site path this file controls.
 *
 * `revalidatePath` because a client router cache entry rendered while somebody
 * was signed in outlives the cookie that made it true. Signing out is rare
 * enough that re-rendering the page being landed on costs nothing worth
 * counting, and chrome that still says "Admin" after signing out is the whole
 * symptom being fixed.
 */
export async function signOutHere(redirectTo?: string) {
  const target = samePath(redirectTo);
  await signOut({ redirect: false });
  revalidatePath(target);
  redirect(target);
}
