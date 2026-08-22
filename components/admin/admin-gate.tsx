import Link from "next/link";

import { signInWith, signOutHere } from "@/lib/actions/auth";

/**
 * The two screens shown instead of the admin.
 *
 * Both are deliberately plain: no sidebar, no topbar, nothing that implies
 * there is an admin behind them to poke at.
 */

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-800 p-6">
        <h1 className="text-lg font-medium text-zinc-200">{title}</h1>
        {children}
      </div>
    </main>
  );
}

const PROVIDER_CLASS =
  "flex w-full items-center justify-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";

export function AdminSignIn() {
  return (
    <Frame title="Sign in">
      <p className="mt-2 text-sm text-zinc-400">
        The admin is for staff accounts. Signing in returns you here.
      </p>
      <div className="mt-5 space-y-2">
        {/*
          `redirectTo` is the admin rather than the guestbook, which is where
          the public sign-in buttons send people. It is sanitised in
          `signInWith` -- a redirect target that came from a request is an open
          redirect otherwise -- and a plain same-site path is all that passes.
        */}
        <form
          action={async () => {
            "use server";
            await signInWith("google", "/admin");
          }}
        >
          <button type="submit" className={PROVIDER_CLASS}>
            Continue with Google
          </button>
        </form>
        <form
          action={async () => {
            "use server";
            await signInWith("github", "/admin");
          }}
        >
          <button type="submit" className={PROVIDER_CLASS}>
            Continue with GitHub
          </button>
        </form>
      </div>
      <Link
        href="/"
        className="mt-5 inline-block text-xs text-zinc-500 underline-offset-2 transition-colors hover:text-indigo-400 hover:underline"
      >
        Back to the site
      </Link>
    </Frame>
  );
}

export function AdminForbidden({ username }: { username: string }) {
  return (
    <Frame title="Not permitted">
      <p className="mt-2 text-sm text-zinc-400">
        You are signed in as <span className="text-zinc-200">{username}</span>, which is not a staff
        account. Signing in again with the same account will not change that.
      </p>
      <div className="mt-5 flex items-center gap-3">
        <form
          action={async () => {
            "use server";
            await signOutHere("/admin");
          }}
        >
          <button
            type="submit"
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          >
            Sign in as someone else
          </button>
        </form>
        <Link
          href="/"
          className="text-xs text-zinc-500 underline-offset-2 transition-colors hover:text-indigo-400 hover:underline"
        >
          Back to the site
        </Link>
      </div>
    </Frame>
  );
}
