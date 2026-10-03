import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ProviderButtons } from "@/components/auth/provider-buttons";
import { LINE_BUTTON } from "@/components/foothill/classes";
import { MAIN, WRAP } from "@/components/foothill/layout";
import { Mark } from "@/components/foothill/mark";
import { PageMotion } from "@/components/foothill/motion";
import { getViewer } from "@/lib/auth/viewer";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to comment and to sign the guestbook.",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  OAuthAccountNotLinked:
    "That email address already signs in with the other provider. Use that one instead.",
  AccessDenied: "That sign-in was declined before it finished.",
  Configuration: "Sign-in is not configured correctly right now. This one is on us.",
  Verification: "That sign-in link has expired or has already been used.",
};

export default function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <main className={MAIN}>
      <div className={WRAP}>
        <div className="mx-auto max-w-[440px] py-8 md:py-16">
          <Mark className="h-5 w-9 text-ink" />
          <h1 data-fh-split className="mt-10 font-display text-[clamp(2.5rem,1.8rem+2.6vw,3.75rem)] leading-[1] font-medium tracking-[-0.04em] text-ink">
            Join the conversation.
          </h1>
          <p data-fh-enter className="mt-5 text-[16px] leading-relaxed text-mute">
            To comment and to sign the guestbook. Nothing is shared beyond your name and avatar. See
            the{" "}
            <Link href="/privacy-policy" className="fh-link text-ink">
              privacy policy
            </Link>
            .
          </p>

          {/* `null`, not a skeleton: there is usually nothing here at all, and
              a placeholder for the absence of an error would be an error
              message in every way but the words. */}
          <Suspense fallback={null}>
            <SignInNotice searchParams={searchParams} />
          </Suspense>

          <div data-fh-enter className="mt-10">
            <ProviderButtons redirectTo="/" buttonClassName={`${LINE_BUTTON} w-full justify-center`} />
          </div>
        </div>
      </div>
      <PageMotion />
    </main>
  );
}

/**
 * The two things about this page that depend on the request: whoever is
 * already signed in goes home, and a failed sign-in says why.
 */
async function SignInNotice({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  // The bounce is a client navigation and not a 307: the status is committed
  // before the session is known, so it cannot be anything else.
  if (await getViewer()) redirect("/");

  const { error } = await searchParams;
  if (!error) return null;

  return (
    <p role="alert" className="mt-8 border-l-2 border-sulfur-mark pl-4 text-[15px] leading-relaxed text-ink">
      {ERRORS[error] ?? "That sign-in did not complete. Try again."}
    </p>
  );
}
