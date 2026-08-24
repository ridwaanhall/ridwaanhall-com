"use client";

import { GitHubMark, GoogleMark } from "@/components/icons/provider-marks";
import { signInWith } from "@/lib/actions/auth";

/**
 * The guestbook's signed-out state.
 *
 * It sits where the composer would, so the panel keeps its shape whether or not
 * anyone is signed in -- a footer that changes height between the two states
 * moves the conversation above it on every sign-in.
 *
 * The two providers are given equal width rather than sized to their labels.
 * "Sign in with GitHub" is two characters longer than "Sign in with Google",
 * and a pair of buttons that differ by that much reads as one being the
 * intended answer.
 */
export function SignInCard() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-400">
        Sign in to leave a message. Nothing is shared beyond your name and
        avatar — see the{" "}
        <a
          href="/privacy-policy"
          className="text-indigo-400 underline transition-colors hover:text-indigo-300"
        >
          privacy policy
        </a>
        .
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <ProviderButton provider="google" label="Sign in with Google">
          <GoogleMark />
        </ProviderButton>
        <ProviderButton provider="github" label="Sign in with GitHub">
          <GitHubMark />
        </ProviderButton>
      </div>
    </div>
  );
}

function ProviderButton({
  provider,
  label,
  children,
}: {
  provider: "google" | "github";
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => signInWith(provider, "/guestbook")}
      className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 text-sm text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
    >
      {children}
      {label}
    </button>
  );
}
