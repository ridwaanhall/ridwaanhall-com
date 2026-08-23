"use client";

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

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" height={18} width={18} aria-hidden="true">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg height={18} width={18} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
