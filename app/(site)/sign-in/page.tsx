import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ProviderButtons } from "@/components/auth/provider-buttons";
import { MAIN } from "@/components/foothill/layout";
import { PageMotion } from "@/components/foothill/motion";
import { getViewer } from "@/lib/auth/viewer";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to comment and to sign the guestbook.",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  OAuthAccountNotLinked: "That email address already signs in with the other provider. Use that one instead.",
  AccessDenied: "That sign-in was declined before it finished.",
  Configuration: "Sign-in is not configured correctly right now. This one is on us.",
  Verification: "That sign-in link has expired or has already been used.",
};

export default function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <main className={MAIN} data-quiet="">
      <div>
        <section className="wrap sign-in">
          <div className="panel sign-card" data-fh-enter="">
            <h1 className="t2">Sign in</h1>
            <p className="meta" style={{ fontSize: 15 }}>
              To comment on posts and sign the guestbook. Nothing is ever posted for you.
            </p>
            {/* `null`, not a skeleton: there is usually nothing here at all, and
                a placeholder for the absence of an error would be an error
                message in every way but the words. */}
            <Suspense fallback={null}>
              <SignInNotice searchParams={searchParams} />
            </Suspense>
            <ProviderButtons redirectTo="/" site />
            <p className="meta">
              By continuing you agree to the{" "}
              <Link className="ul" href="/terms">
                terms
              </Link>{" "}
              and the{" "}
              <Link className="ul" href="/privacy-policy">
                privacy policy
              </Link>
              .
            </p>
          </div>
        </section>
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
    <p role="alert" className="sign-error">
      {ERRORS[error] ?? "That sign-in did not complete. Try again."}
    </p>
  );
}
