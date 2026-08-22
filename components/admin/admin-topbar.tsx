import Link from "next/link";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { signOutHere } from "@/lib/actions/auth";
import type { StaffUser } from "@/lib/auth/staff";

/**
 * The bar above every admin screen.
 *
 * Sign-out is a form posting a server action rather than a link, because
 * signing out is a state change and a `GET` that ends a session is reachable by
 * a prefetch. The public site's two sign-out buttons route through the shared
 * confirm dialog; this one does not, since losing an admin session costs a
 * click to get back and the dialog would be in the way of a routine action.
 */
export function AdminTopbar({ user }: { user: StaffUser }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-zinc-800 bg-black/80 px-4 backdrop-blur-sm lg:px-6">
      {/* Clears the fixed hamburger, which sits at the same corner below `lg`. */}
      <div className="w-10 lg:hidden" aria-hidden="true" />

      <Link
        href="/"
        className="text-sm text-zinc-400 transition-colors hover:text-indigo-400"
        title="Open the public site"
      >
        View site
      </Link>

      <div className="ml-auto flex items-center gap-3">
        {/* No "superuser" badge. The flag went with the Django auth tables in
            drizzle/0005: every staff account carried it, so it marked nobody
            out, and there was no permission matrix behind it to mean anything. */}
        <span className="hidden text-sm text-zinc-400 sm:inline">{user.fullName}</span>
        <ThemeToggle iconSize="h-4 w-4" />
        <form
          action={async () => {
            "use server";
            await signOutHere("/");
          }}
        >
          <button
            type="submit"
            className="rounded-md border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
