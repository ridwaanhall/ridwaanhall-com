import type { Metadata } from "next";
import { cookies } from "next/headers";

import { AdminForbidden, AdminSignIn } from "@/components/admin/admin-gate";
import { AdminMain } from "@/components/admin/admin-main";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { RAIL_COOKIE, RAIL_MINI } from "@/lib/admin/rail";
import { permittedKeys } from "@/lib/auth/permissions";
import { staffGate } from "@/lib/auth/staff";

/**
 * The admin's chrome, and the screen a rejected reader is shown.
 *
 * **This is not the gate, and must never be mistaken for one.** A layout
 * chooses what is displayed; it does not decide whether its pages run. React
 * renders a layout and its children concurrently, so returning
 * `<AdminForbidden />` here instead of `{children}` still leaves the page
 * underneath executing and its Flight payload in the response -- which is
 * exactly what happened, and is written up on `requireStaff` in
 * `lib/auth/staff.ts`. Every page under this segment calls `requireStaff()`
 * itself, as its first `await`. Route handlers and server actions, which do
 * not nest under a layout at all, call `isStaffRequest()`.
 *
 * The gate is not in `proxy.ts` either, though the plan called for middleware:
 * `is_staff` is read from the database per request and never carried in the
 * session token, so an edge proxy cannot answer it without a Postgres round
 * trip on everything matching the path. `proxy.ts` still matches `/admin/` to
 * set `X-Robots-Tag: noindex`.
 *
 * The site's own layout is deliberately not reused: this has no profile rail,
 * no search palette and no page-entrance transform. The toast stack, confirm
 * dialog, tooltips and theme all come from the root layout, so they work here
 * without being mounted twice.
 */
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/**
 * Never prerendered.
 *
 * `cacheComponents` asks every route to produce a static shell, and the public
 * pages answer that by putting their request-dependent parts behind
 * `<Suspense>`. There is no equivalent answer here: the *first* thing every
 * admin screen does is read the session cookie and ask the database who is
 * asking, and a shell rendered before that question is a cached page of a gated
 * screen. Blocking is the honest shape -- the admin has one user, is behind a
 * sign-in, and is `noindex`, so there is nothing a prerender would buy.
 */
export const instant = false;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const gate = await staffGate();

  if (gate.status === "anonymous") return <AdminSignIn />;
  if (gate.status === "forbidden") return <AdminForbidden username={gate.username} />;

  /*
   * Whether the rail is collapsed, read before anything is painted.
   *
   * Free, in the only sense that matters: `cookies()` opts a route into dynamic
   * rendering, and `instant = false` above has already done that -- this layout
   * blocks on `staffGate()` reading the session before it can decide anything
   * at all. So the width arrives with the first byte instead of being restored
   * from `localStorage` a frame after the wrong one has been painted.
   */
  const mini = (await cookies()).get(RAIL_COOKIE)?.value === RAIL_MINI;

  /*
   * Which screens this account may open, computed here and passed down.
   *
   * **The rail is a client component**, so this cannot be asked there: the
   * answer needs the session and the database, and a client module importing
   * `lib/auth/staff.ts` would not compile against `server-only` -- which is the
   * good outcome. The bad one is subtler and this project has paid for it once:
   * a value exported from a `"use client"` module and imported by a server one
   * arrives as a client *reference* rather than the value, typed exactly as
   * declared, so nothing reports it. The direction that works is props.
   *
   * A plain `string[]`, not a `Set`, because it crosses that boundary and a Set
   * does not survive serialisation. `AdminSidebar` builds the Set on its side.
   *
   * Free, at this point: `getStaffUser` is memoised per request and
   * `staffGate()` above has already read the row and the grants.
   */
  const permitted = permittedKeys(gate.user);

  return (
    <AdminShell
      signedInAs={gate.user.username}
      initialMini={mini}
      permitted={permitted}
      topbar={<AdminTopbar user={gate.user} />}
    >
      <AdminMain>{children}</AdminMain>
    </AdminShell>
  );
}
