import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

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

/**
 * The public way in.
 *
 * **The card is static and prerenders; only what depends on the request is
 * behind the boundary.** Under `cacheComponents` an uncached read outside one
 * is a build error, and there are two here -- the session, and the error code a
 * provider sends back -- so both live in `SignInNotice`. This is the shape the
 * guestbook and the dashboard already use.
 *
 * It is deliberately *not* the admin's shape. `app/admin/layout.tsx` sets
 * `instant = false` and blocks, because a shell rendered before the staff
 * question is a cached page of a gated screen. Nothing here is gated: the card
 * is the same for everyone and the only request-dependent thing is whether the
 * reader should be here at all. Blocking for that cost the route its skeleton
 * -- `instant = false` suppresses the loading state, so `loading.tsx` never
 * rendered and a slow click sat on the previous page with nothing to show for
 * it.
 *
 * What it buys back, and the trade worth knowing: a reader who is already
 * signed in now sees the card for the moment before the bounce, where blocking
 * meant they never saw it. The sidebar does not offer them this page, so that
 * is a typed URL or a stale link against every signed-out reader who clicks
 * Sign in.
 */
export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
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

          {/* `null`, not a skeleton: there is usually nothing here at all, and
              a placeholder for the absence of an error would be an error
              message in every way but the words. */}
          <Suspense fallback={null}>
            <SignInNotice searchParams={searchParams} />
          </Suspense>

          <div className="mt-5">
            <ProviderButtons redirectTo="/" />
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * The two things about this page that depend on the request.
 *
 * One boundary rather than two, because they resolve together and a second
 * would be a second hole in the same card.
 */
async function SignInNotice({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  // Offering a sign-in to somebody who has one is a loop, and the same
  // conclusion `AdminForbidden` reaches from the other direction. The bounce is
  // a client navigation and not a 307: the status is committed before the
  // session is known, so it cannot be anything else.
  if (await getViewer()) redirect("/");

  const { error } = await searchParams;
  if (!error) return null;

  return (
    <p
      role="alert"
      className="mt-4 rounded-lg border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-300"
    >
      {ERRORS[error] ?? "That sign-in did not complete. Try again."}
    </p>
  );
}
