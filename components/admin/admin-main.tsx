"use client";

import { usePathname } from "next/navigation";

/**
 * The admin's content column.
 *
 * A client component for one reason: the `key`. Keying on the pathname makes
 * React discard the previous screen's DOM rather than reconciling it, which is
 * what lets the entrance animation replay on every navigation. Without it the
 * table for one model is patched into the table for another and nothing says
 * the page changed -- which is how the admin behaved before, and why moving
 * between two dense screens felt like nothing had happened.
 *
 * The public site does the same thing in `SiteShell` for the same reason.
 */
export function AdminMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main key={pathname} className="admin-rise px-4 py-6 lg:px-6">
      {children}
    </main>
  );
}
