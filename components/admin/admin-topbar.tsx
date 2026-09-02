import Link from "next/link";

import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { ForwardIcon } from "@/components/admin/admin-icons";
import { RolePill } from "@/components/admin/role-pill";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { signOutHere } from "@/lib/actions/auth";
import { adminRole } from "@/lib/auth/roles";
import type { StaffUser } from "@/lib/auth/staff";

/**
 * The bar above every admin screen.
 *
 * It carries the trail on the left and the account controls on the right. The
 * trail is its own client component: this file has to stay a server component,
 * because sign-out is a form posting a server action rather than a link --
 * signing out is a state change, and a `GET` that ends a session is reachable
 * by a prefetch.
 *
 * Sign-out confirms first, through the same dialog the guestbook and the
 * comment forms use: the button sits at the end of a row that is otherwise all
 * safe controls, and an accidental click costs a round trip through an OAuth
 * provider to undo.
 *
 * **One theme toggle.** The rail does not get a second one -- two visible
 * toggles is the failure `scripts/check-breakpoints.mjs` exists to catch on the
 * public site, and there is no reason for the admin to reintroduce it.
 */
export function AdminTopbar({ user }: { user: StaffUser }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-zinc-800 bg-black/80 px-4 backdrop-blur-sm lg:px-6">
      {/* Clears the fixed hamburger, which sits at the same corner below `lg`. */}
      <div className="w-10 shrink-0 lg:hidden" aria-hidden="true" />

      <AdminBreadcrumb />

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        {/*
          The name and the role, together, because either alone is half an
          answer: who is signed in, and what that account can do. There is no
          prop to thread -- `staffGate` already read the row this renders.
        */}
        <span className="hidden items-center gap-2 md:inline-flex">
          <span className="text-sm text-zinc-400">{user.fullName}</span>
          <RolePill role={adminRole(user.isSuperuser)} />
        </span>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-zinc-400 transition-colors hover:text-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          title="Open the public site"
        >
          <span className="hidden sm:inline">View site</span>
          <ForwardIcon aria-hidden="true" height={14} width={14} />
        </Link>

        <ThemeToggle iconSize="h-4 w-4" />

        <form
          action={async () => {
            "use server";
            await signOutHere("/");
          }}
        >
          <SignOutButton
            message="You'll need to sign in again to reach the admin."
            className="cursor-pointer rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          />
        </form>
      </div>
    </header>
  );
}
