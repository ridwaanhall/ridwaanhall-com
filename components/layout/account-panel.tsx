import Link from "next/link";

import { AccountMenu } from "@/components/foothill/account-menu";
import { ACCOUNT_ROW } from "@/components/foothill/classes";
import { Icon } from "@/components/foothill/icons";
import { Roll } from "@/components/foothill/motion";
import { SignOutButton } from "@/components/sign-out-button";
import { signOutHere } from "@/lib/actions/auth";
import { getStaffUser } from "@/lib/auth/staff";
import { getViewer } from "@/lib/auth/viewer";
import { cn } from "@/lib/utils/cn";

/**
 * Who is signed in, in the site's chrome.
 *
 * The only part of the shell that depends on who is asking, so the layout
 * renders it inside a `<Suspense>` and the rest of every page stays static.
 * Signed out it is a link to `/sign-in`; signed in it is the account menu,
 * with the admin offered only to an account `getStaffUser` accepts -- asked of
 * the database, never of the session token.
 */
export async function AccountPanel() {
  const viewer = await getViewer();
  const staff = viewer ? await getStaffUser() : null;

  if (!viewer) {
    return (
      <Link href="/sign-in" className="text-[14px] text-mute transition-colors hover:text-ink">
        <Roll>Sign in</Roll>
      </Link>
    );
  }

  return (
    <AccountMenu
      name={viewer.fullName}
      username={viewer.username}
      imageUrl={viewer.profileImage}
      role={viewer.role}
    >
      {/* Admin above, and the act that costs something last. */}
      {staff && (
        <Link href="/admin" className={ACCOUNT_ROW}>
          <Icon name="pulse" className="text-mute" />
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
          className={cn(ACCOUNT_ROW, "text-mute hover:text-ink")}
          message="You'll be signed out on this device and returned to the home page."
        />
      </form>
    </AccountMenu>
  );
}

/** Holds the slot's width while the session is read, so the bar does not shift. */
export function AccountPanelSkeleton() {
  return <span aria-hidden="true" className="inline-block h-5 w-14 rounded bg-raise" />;
}
