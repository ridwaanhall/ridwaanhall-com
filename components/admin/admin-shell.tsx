"use client";

import { useCallback, useState } from "react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { RAIL_COOKIE, RAIL_MAX_AGE, RAIL_MINI } from "@/lib/admin/rail";
import { cn } from "@/lib/utils/cn";

/**
 * The admin's frame: the rail, and the column beside it.
 *
 * A client component for one piece of state -- whether the rail is collapsed --
 * and everything else passes straight through. `topbar` and `children` arrive
 * as `ReactNode`, which is what keeps every page and the topbar itself server
 * components: they are rendered on the server and handed here already-formed,
 * so nothing holding a Drizzle column ever crosses the boundary.
 *
 * **The state starts on the server.** `app/admin/layout.tsx` reads the cookie
 * and seeds `initialMini`, so the first paint is already the right width. The
 * alternative -- `localStorage` in an effect -- paints 16rem and then snaps to
 * 4.5rem on every full page load, which is a flash on the one route that never
 * gets a prerendered shell.
 *
 * **Writing it back is `document.cookie`, deliberately.** A server action would
 * be a round trip and a re-render for a preference the browser can record by
 * itself, and cookies cannot be set during render at all -- Next's own
 * documentation is explicit that `.set` belongs in a server function or a route
 * handler. Nothing on the server reads this until the next request, by which
 * time the browser has sent it.
 *
 * The cookie's *name* comes from `lib/admin/rail.ts` rather than from here, and
 * that is not tidiness: this module is `"use client"`, so a constant exported
 * from it reaches the layout as a client reference instead of a string. It is
 * written up there.
 */
export function AdminShell({
  signedInAs,
  initialMini,
  topbar,
  children,
}: {
  signedInAs: string;
  initialMini: boolean;
  topbar: React.ReactNode;
  children: React.ReactNode;
}) {
  const [mini, setMini] = useState(initialMini);

  const toggle = useCallback(() => {
    const next = !mini;
    setMini(next);
    /*
     * Not `httpOnly`: this is the one cookie here the client has to be able to
     * write. `secure` only where it can be honoured -- adding it on plain HTTP
     * makes the browser drop the cookie outright, which in development reads as
     * a rail that forgets on every reload.
     */
    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${RAIL_COOKIE}=${next ? RAIL_MINI : "full"}; path=/; max-age=${RAIL_MAX_AGE}; samesite=lax${secure}`;
  }, [mini]);

  return (
    <div className="min-h-screen bg-black">
      <AdminSidebar signedInAs={signedInAs} mini={mini} onToggleMini={toggle} />
      {/*
        The same `admin-rail-shift` the rail carries, so the two move as one
        thing. Without it the rail animates its width over 260ms while the
        content jumps to the new gutter immediately, which reads as the page
        breaking rather than as a panel closing.
      */}
      <div className={cn("admin-rail-shift", mini ? "lg:pl-18" : "lg:pl-64")}>
        {topbar}
        {children}
      </div>
    </div>
  );
}
