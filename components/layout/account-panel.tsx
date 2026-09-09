import Link from "next/link";

import { AccountMenu } from "@/components/layout/account-menu";
import { SignOutButton } from "@/components/sign-out-button";
import { SkeletonBar } from "@/components/skeleton";
import { signOutHere } from "@/lib/actions/auth";
import { getStaffUser } from "@/lib/auth/staff";
import { getViewer } from "@/lib/auth/viewer";

/**
 * Who is signed in, and everything a reader can do about it.
 *
 * The site had no account chrome at all: signing in was reachable only from
 * inside the guestbook or a comment thread, and nothing anywhere said whether
 * anybody was signed in. So signing out of the admin -- which lands on the home
 * page -- looked exactly like signing out having failed. Whatever else changes
 * here, the chrome has to keep answering "who is this" on sight.
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
 * as wide as whatever holds it would read as the most important thing in the
 * chrome, which it is not, and the availability chips had already settled what
 * a small, optional, self-sized control looks like here.
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
 * **Two of these are created per request, one per placement.** They are made in
 * `app/(site)/layout.tsx` and handed down as elements, so each streams into a
 * layout that stays fully prerendered. One element rendered in both places
 * cannot be two shapes -- the navbar's opens downward from a control the width
 * of an avatar, the drawer's upward across a column -- and `variant` is what
 * decides which. Both reads it makes are memoised, which is what makes the
 * second element free: without the memo it would be two identities and two
 * staff checks to draw one row.
 *
 * The drawer's copy renders inside the band that owns the rule and the gutter --
 * see `SmallPrint`. The navbar's brings neither: a row that already has a
 * bottom rule does not want a second one.
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

export async function AccountPanel({
  variant = "drawer",
}: {
  /** Where this copy is going: the navbar's row, or the drawer's band. */
  variant?: "navbar" | "drawer";
}) {
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
   * One role, already decided.
   *
   * `getUserProfile` reads it from `account` on every request, so this is the
   * same answer the actions enforce with rather than a second opinion drawn
   * from whether an Admin link happens to be in the menu. Public is drawn here
   * and only here -- it is what every signed-in reader has, so a badge for it
   * anywhere else would mark nobody out.
   */
  const role = viewer.role;

  return (
    <AccountMenu
      name={viewer.fullName}
      username={viewer.username}
      imageUrl={viewer.profileImage}
      role={role}
      variant={variant}
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
 * "Sign in". A signed-in row is 22px taller, and neither placement lets that
 * difference move the page: the navbar's row is a fixed height, and in the
 * drawer the band is pinned below a scroll region that absorbs it. It draws no
 * rule and no gutter of its own for the same reason the real panel does not --
 * whatever holds it owns both.
 */
export function AccountPanelSkeleton() {
  return (
    <div aria-hidden="true">
      <SkeletonBar className="h-[26px] w-16 rounded-full skeleton-pulse" />
    </div>
  );
}
