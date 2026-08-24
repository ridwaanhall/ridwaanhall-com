import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { AvatarFallback } from "@/components/site/guestbook/role-badge";
import { SkeletonBar } from "@/components/skeleton";
import { signOutHere } from "@/lib/actions/auth";
import { getViewer } from "@/lib/auth/viewer";

/**
 * Who is signed in, and the way in or out.
 *
 * The site had no account chrome at all: signing in was reachable only from
 * inside the guestbook or a comment thread, and nothing anywhere said whether
 * anybody was signed in. So signing out of the admin -- which lands on the home
 * page -- looked exactly like signing out having failed.
 *
 * **Both controls are the availability chip's pill**, and the same one as each
 * other: `pill-badge` for the shape, `text-xs`, and no width of their own, so
 * each is exactly as wide as the two words in it. They were a full-width
 * `h-11` button first and a full-width nav row after that, and both were wrong
 * in the same way -- a control the width of the column reads as the most
 * important thing in the rail, which signing in is not. The chips beside
 * `@username` had already settled what a small, optional, self-sized control
 * looks like here.
 *
 * It sits between the rail's scroll region and the pinned footer, which is the
 * one place in the chrome that is neither navigation nor legal text. Pinned
 * rather than scrolled, for the same reason the footer is: on a short window
 * the nav scrolls and this must not go with it.
 *
 * Like `AdminLink`, this is created once in `app/(site)/layout.tsx` and
 * rendered by both the rail and the drawer, so it streams into a layout that
 * stays fully prerendered. `getViewer` is memoised per request because of that
 * -- see `lib/auth/viewer.ts`.
 */
const PILL =
  "pill-badge cursor-pointer border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";

export async function AccountPanel() {
  const viewer = await getViewer();

  return (
    <div className="border-t border-zinc-800/50 px-3 py-3">
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

          {/* A form posting a server action, not a link: signing out is a state
              change, and a `GET` that ends a session is reachable by a
              prefetch. The form is block-level and the button is not, so the
              pill still ends where its label does. */}
          <form
            className="mt-2.5"
            action={async () => {
              "use server";
              await signOutHere("/");
            }}
          >
            <SignOutButton
              message="You'll be signed out on this device and returned to the home page."
              className={PILL}
            />
          </form>
        </>
      ) : (
        <Link href="/sign-in" className={PILL}>
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
    <div className="border-t border-zinc-800/50 px-3 py-3" aria-hidden="true">
      <SkeletonBar className="h-[26px] w-16 rounded-full skeleton-pulse" />
    </div>
  );
}
