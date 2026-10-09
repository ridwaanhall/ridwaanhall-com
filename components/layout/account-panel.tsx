import Link from "next/link";

import { AccountMenu } from "@/components/foothill/account-menu";
import { Icon } from "@/components/foothill/icons";
import { SignOutButton } from "@/components/sign-out-button";
import { signOutHere } from "@/lib/actions/auth";
import { getStaffUser } from "@/lib/auth/staff";
import { getViewer } from "@/lib/auth/viewer";
import { GUESTBOOK_ENABLED } from "@/lib/nav";

/**
 * Who is signed in, in the site's chrome.
 *
 * The only part of the shell that depends on who is asking, so the layout
 * renders it inside a `<Suspense>` and the rest of every page stays static.
 * Signed out it is a link to `/sign-in`; signed in it is the avatar and its
 * menu, with the admin offered only to an account `getStaffUser` accepts --
 * asked of the database, never of the session token.
 */
export async function AccountPanel() {
  const viewer = await getViewer();
  const staff = viewer ? await getStaffUser() : null;

  if (!viewer) {
    return (
      <Link href="/sign-in" className="signin">
        <span className="roll">
          <span>Sign in</span>
        </span>
      </Link>
    );
  }

  return (
    <AccountMenu name={viewer.fullName} username={viewer.username} imageUrl={viewer.profileImage} role={viewer.role}>
      {GUESTBOOK_ENABLED && (
        <Link role="menuitem" href="/guestbook">
          <Icon name="msg" />
          Your messages
        </Link>
      )}
      {staff && (
        <Link role="menuitem" href="/admin">
          <Icon name="layers" />
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
          role="menuitem"
          icon={<Icon name="login" />}
          message="You'll be signed out on this device and returned to the home page."
        />
      </form>
    </AccountMenu>
  );
}

/** Holds the slot's width while the session is read, so the bar does not shift. */
export function AccountPanelSkeleton() {
  return <span aria-hidden="true" className="skb" style={{ width: 56, height: 20 }} />;
}
