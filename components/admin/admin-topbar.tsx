import Link from "next/link";

import { AdminSignOutButton } from "@/components/admin/sign-out-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { signOutHere } from "@/lib/actions/auth";
import type { StaffUser } from "@/lib/auth/staff";

/**
 * The bar above every admin screen.
 *
 * Sign-out is a form posting a server action rather than a link, because
 * signing out is a state change and a `GET` that ends a session is reachable by
 * a prefetch. It confirms first, through the same dialog the guestbook and the
 * comment forms use -- the button sits at the end of a row that is otherwise
 * all safe controls, and an accidental click costs a round trip through an
 * OAuth provider to undo.
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
        {/* No "superuser" badge: there is one privilege, so a badge every staff
            account carries would mark nobody out. */}
        <span className="hidden text-sm text-zinc-400 sm:inline">{user.fullName}</span>
        <ThemeToggle iconSize="h-4 w-4" />
        <form
          action={async () => {
            "use server";
            await signOutHere("/");
          }}
        >
          <AdminSignOutButton />
        </form>
      </div>
    </header>
  );
}
