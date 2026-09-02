import Link from "next/link";

import { AccountMenu } from "@/components/layout/account-menu";
import { SignOutButton } from "@/components/sign-out-button";
import { SkeletonBar } from "@/components/skeleton";
import { signOutHere } from "@/lib/actions/auth";
import { rolesFor } from "@/lib/auth/roles";
import { getStaffUser } from "@/lib/auth/staff";
import { getViewer } from "@/lib/auth/viewer";

/**
 * Who is signed in, and everything a reader can do about it.
 *
 * The site had no account chrome at all: signing in was reachable only from
 * inside the guestbook or a comment thread, and nothing anywhere said whether
 * anybody was signed in. So signing out of the admin -- which lands on the home
 * page -- looked exactly like signing out having failed. Whatever else changes
 * here, the sidebar has to keep answering "who is this" on sight.
 *
 * **Signed in, that answer is the control.** The row naming the reader is the
 * button that opens their menu, so identity and the two things they can do
 * about it cost one row between them instead of three. The row before this one
 * was an identity block with a pair of pills beneath it, which drew two session
 * controls at the same weight as eight navigation links.
 *
 * **Signed out, it stays a plain link.** One small pill, exactly as wide as its
 * label, and nothing hiding behind anything: this is what most readers get, and
 * it is the one control here that still works with no script at all. A control
 * the width of the column would read as the most important thing in the rail,
 * which it is not, and the availability chips beside `@username` had already
 * settled what a small, optional, self-sized control looks like here.
 *
 * **The hue waits to be asked for.** Both menu rows rest at the same grey and
 * take their colour on hover, the same bargain `StatusChip` strikes. Signing
 * out is the one act here that throws something away, so it goes red. Admin
 * takes indigo, which is already the admin's own accent, and shares it with the
 * signed-out pill without ever clashing: one shows only to a signed-in reader
 * and the other only to a signed-out one, so the two are never on screen
 * together.
 *
 * The way into the admin used to be a bullet after "Terms" in the small print,
 * which put the one screen a staff reader might actually want among the legal
 * links and drew it like one. It is an account action, and it belongs with the
 * other account action.
 *
 * This renders inside the sidebar's base, which owns the rule and the gutter --
 * see `SidebarFooter`. It is created once in `app/(site)/layout.tsx` and
 * rendered by both the rail and the drawer, so it streams into a layout that
 * stays fully prerendered. Both reads it makes are memoised for that reason:
 * the element renders twice per request, and without the memo that is two
 * identities and two staff checks to draw one row.
 */
const PILL =
  "pill-badge cursor-pointer border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";

/**
 * A row of the account menu: full width, because a menu's rows are a list and a
 * list has one left edge.
 */
const MENU_ROW =
  "flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";

/*
 * Written out rather than composed from the hue. Tailwind emits only a class it
 * can see in the source, so building one from a variable would produce no rule
 * at all -- the same reason `status-badges.tsx` spells its three out.
 */
const HOVER_ACCENT = "hover:border-indigo-700/60 hover:text-indigo-400";
const HOVER_ADMIN = "hover:text-indigo-400";
const HOVER_LEAVE = "hover:text-red-400";

export async function AccountPanel() {
  const viewer = await getViewer();
  // Not from the session: `is_staff` is read from the database on every request
  // and never carried in the token -- see `lib/auth/staff.ts`.
  const staff = viewer ? await getStaffUser() : null;

  if (!viewer) {
    return (
      <Link href="/sign-in" className={`${PILL} ${HOVER_ACCENT}`}>
        Sign in
      </Link>
    );
  }

  /*
   * Both halves of this are already in hand, and neither is from the token.
   * `staff` carries the admin roles and `viewer` the guestbook ones -- they are
   * different questions about the same person, so an account holds one, both or
   * neither, and the row says which rather than making somebody guess from
   * whether an Admin link happens to be in the menu.
   */
  const roles = rolesFor({
    isSuperuser: staff?.isSuperuser ?? false,
    isStaff: staff !== null,
    isAuthor: viewer.isAuthor,
    isCoAuthor: viewer.isCoAuthor,
  });

  return (
    <AccountMenu
      name={viewer.fullName}
      username={viewer.username}
      imageUrl={viewer.profileImage}
      roles={roles}
    >
      {/* Admin above, and the act that costs something last. */}
      {staff && (
        <Link href="/admin" className={`${MENU_ROW} ${HOVER_ADMIN}`}>
          Admin
        </Link>
      )}

      {/* A form posting a server action, not a link: signing out is a state
          change, and a `GET` that ends a session is reachable by a prefetch. */}
      <form
        action={async () => {
          "use server";
          await signOutHere("/");
        }}
      >
        <SignOutButton
          message="You'll be signed out on this device and returned to the home page."
          className={`${MENU_ROW} ${HOVER_LEAVE}`}
        />
      </form>
    </AccountMenu>
  );
}

/**
 * What stands in the prerendered shell until the session is known.
 *
 * Sized to the signed-out state, which is what most readers get: one `text-xs`
 * pill at the vertical padding it carries, so 26px tall and about as wide as
 * "Sign in". A signed-in row is 22px taller, and that difference is absorbed by
 * the rail's scroll region -- it sits above this and is the flexible child --
 * rather than moving the page. It draws no rule and no gutter of its own for
 * the same reason the real panel does not: the sidebar's base owns both.
 */
export function AccountPanelSkeleton() {
  return (
    <div aria-hidden="true">
      <SkeletonBar className="h-[26px] w-16 rounded-full skeleton-pulse" />
    </div>
  );
}
