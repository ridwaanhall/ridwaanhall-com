import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { AvatarFallback } from "@/components/site/guestbook/role-badge";
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
 * page -- looked exactly like signing out having failed.
 *
 * **Every control here is the availability chip's pill**: `pill-badge` for the
 * shape, `text-xs`, and no width of its own, so each is exactly as wide as the
 * word or two in it. A control the width of the column would read as the most
 * important thing in the rail, which none of these is, and the chips beside
 * `@username` had already settled what a small, optional, self-sized control
 * looks like here.
 *
 * **The hue is the only thing that differs, and it waits to be asked for.** At
 * rest all three are `zinc-400` inside a `zinc-700` outline; the colour arrives
 * on hover, which is the same bargain `StatusChip` strikes -- the meaning is
 * there when wanted without three tinted pills competing with the page. Signing
 * out is the one act here that throws something away, so it goes red. Admin
 * takes indigo because that is already the admin's own accent, and it can share
 * it with Sign in without ever clashing: one shows only to a signed-in reader
 * and the other only to a signed-out one, so the two are never on screen
 * together.
 *
 * The way into the admin used to be a bullet after "Terms" in the footer, which
 * put the one screen a staff reader might actually want among the legal links
 * and drew it like one. It is an account action, and it belongs with the other
 * account actions.
 *
 * The panel sits between the rail's scroll region and the pinned footer, which
 * is the one place in the chrome that is neither navigation nor legal text.
 * Pinned rather than scrolled, for the same reason the footer is: on a short
 * window the nav scrolls and this must not go with it. Its rule and the
 * footer's are one weight -- `zinc-700/80` -- so the bottom of the rail reads
 * as two banded sections rather than one edge and one smudge; at the
 * `zinc-800/50` both used to carry, neither was really there.
 *
 * It is created once in `app/(site)/layout.tsx` and rendered by both the rail
 * and the drawer, so it streams into a layout that stays fully prerendered.
 * Both reads it makes are memoised for that reason: the element renders twice
 * per request, and without the memo that is two identities and two staff checks
 * to draw one row.
 */
const PILL =
  "pill-badge cursor-pointer border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";

/*
 * Written out rather than composed from the hue. Tailwind emits only a class it
 * can see in the source, so `hover:border-${hue}-700/60` would produce no rule
 * at all -- the same reason `status-badges.tsx` spells its three out.
 */
const HOVER_ACCENT = "hover:border-indigo-700/60 hover:text-indigo-400";
const HOVER_LEAVE = "hover:border-red-700/60 hover:text-red-400";

export async function AccountPanel() {
  const viewer = await getViewer();
  // Not from the session: `is_staff` is read from the database on every request
  // and never carried in the token -- see `lib/auth/staff.ts`.
  const staff = viewer ? await getStaffUser() : null;

  return (
    <div className="border-t border-zinc-700/80 px-3 py-3">
      {viewer ? (
        <>
          <div className="flex items-center gap-2.5">
            {viewer.profileImage ? (
              /* eslint-disable-next-line @next/next/no-img-element --
                 avatars are arbitrary provider URLs; next/image needs every
                 host allow-listed in advance and these are 28px, so optimising
                 them would cost a round trip to save nothing. */
              <img
                src={viewer.profileImage}
                alt=""
                width={28}
                height={28}
                loading="lazy"
                className="avatar-ring w-7 h-7"
              />
            ) : (
              <AvatarFallback className="w-7 h-7" glyph="w-3.5 h-3.5" />
            )}
            {/* `min-w-0` is what lets `truncate` work in a flex child: without
                it the column takes its content's width and the rail's 248px
                are simply overrun. */}
            <div className="min-w-0">
              <div className="truncate text-sm text-zinc-200">{viewer.fullName}</div>
              <div className="truncate text-xs text-zinc-500">@{viewer.username}</div>
            </div>
          </div>

          {/* `flex-wrap` because the pair is only ever as wide as its two
              labels here, but the drawer's copy shares this markup and a long
              display name is not the only thing that can push it. */}
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {/* A form posting a server action, not a link: signing out is a
                state change, and a `GET` that ends a session is reachable by a
                prefetch. The form is a flex item wrapping an inline-flex
                button, so the pill still ends where its label does. */}
            <form
              action={async () => {
                "use server";
                await signOutHere("/");
              }}
            >
              <SignOutButton
                message="You'll be signed out on this device and returned to the home page."
                className={`${PILL} ${HOVER_LEAVE}`}
              />
            </form>

            {staff && (
              <Link href="/admin" className={`${PILL} ${HOVER_ACCENT}`}>
                Admin
              </Link>
            )}
          </div>
        </>
      ) : (
        <Link href="/sign-in" className={`${PILL} ${HOVER_ACCENT}`}>
          Sign in
        </Link>
      )}
    </div>
  );
}

/**
 * What stands in the prerendered shell until the session is known.
 *
 * Sized to the signed-out state, which is what most readers get: one `text-xs`
 * pill at `py-1`, so 26px tall and about as wide as "Sign in". A signed-in one
 * is taller, and that difference is absorbed by the rail's scroll region -- it
 * sits above this and is the flexible child -- rather than moving the page.
 */
export function AccountPanelSkeleton() {
  return (
    <div className="border-t border-zinc-700/80 px-3 py-3" aria-hidden="true">
      <SkeletonBar className="h-[26px] w-16 rounded-full skeleton-pulse" />
    </div>
  );
}
