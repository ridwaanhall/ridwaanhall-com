import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProviderButtons } from "@/components/auth/provider-buttons";
import { getViewer } from "@/lib/auth/viewer";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to comment and to sign the guestbook.",
  // The header in `proxy.ts` is what a crawler acts on -- this is what a
  // crawler that reached the page through a link reads.
  robots: { index: false, follow: false },
};

/**
 * Never prerendered.
 *
 * The page's whole job is to answer a question about the request: whoever is
 * already signed in must not be shown a sign-in form, and an error the provider
 * sent back arrives as a search param. Both are read before anything renders,
 * so there is no static shell to produce -- the same call `app/admin/layout.tsx`
 * makes, for the same reason.
 */
export const instant = false;

/**
 * What each Auth.js error code actually means to the person reading it.
 *
 * Before this page existed, `pages.error` pointed at the guestbook, which reads
 * no search params at all -- so every one of these was delivered to a page that
 * silently dropped it, and a failed sign-in looked like a sign-in that had
 * simply not happened.
 */
const ERRORS: Record<string, string> = {
  OAuthAccountNotLinked:
    "That email address already signs in with the other provider. Use that one instead.",
  AccessDenied: "That sign-in was declined before it finished.",
  Configuration: "Sign-in is not configured correctly right now. This one is on us.",
  Verification: "That sign-in link has expired or has already been used.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Offering a sign-in to somebody who has one is a loop, and the same
  // conclusion `AdminForbidden` reaches from the other direction.
  if (await getViewer()) redirect("/");

  const { error } = await searchParams;
  const message = error ? (ERRORS[error] ?? "That sign-in did not complete. Try again.") : null;

  return (
    <main className="px-3 py-4 sm:px-4 md:px-6 lg:px-8">
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-sm rounded-lg border border-zinc-800 p-6">
          <h1 className="text-lg font-medium text-zinc-200">Sign in</h1>
          <p className="mt-2 text-sm text-zinc-400">
            To comment and to sign the guestbook. Nothing is shared beyond your name and
            avatar &mdash; see the{" "}
            <a
              href="/privacy-policy"
              className="text-indigo-400 underline transition-colors hover:text-indigo-300"
            >
              privacy policy
            </a>
            .
          </p>

          {message && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-300"
            >
              {message}
            </p>
          )}

          <div className="mt-5">
            <ProviderButtons redirectTo="/" />
          </div>
        </div>
      </div>
    </main>
  );
}
