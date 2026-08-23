import Link from "next/link";

import { getStaffUser } from "@/lib/auth/staff";

/**
 * The way in to the admin, for the one reader entitled to it.
 *
 * The public site is prerendered, so this is deliberately the *only* part of
 * the chrome that is not: `app/(site)/layout.tsx` renders it inside
 * `<Suspense>`,
 * the static shell ships with the link absent, and it streams in afterwards for
 * whoever turns out to be staff. Reading the flag in the layout itself would
 * make every page on the site dynamic to decide one link.
 *
 * `is_staff` comes from the database, never from the session token -- see
 * `lib/auth/staff.ts`. The rail and the drawer both render this, and
 * `getStaffUser` is memoised per request, so that is one query and not two.
 *
 * The separator is inside the component on purpose. A reader who is not staff
 * gets `null` from the whole thing rather than a dangling bullet after "Terms".
 */
export async function AdminLink() {
  const user = await getStaffUser();
  if (!user) return null;

  return (
    <>
      <span className="text-zinc-600">•</span>
      <Link href="/admin" className="transition-colors hover:text-zinc-300">
        Admin
      </Link>
    </>
  );
}
