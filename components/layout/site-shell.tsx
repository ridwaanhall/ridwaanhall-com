"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { SearchModalProvider } from "@/components/layout/search-modal";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNavbar } from "@/components/layout/site-navbar";
import type { AboutData } from "@/lib/data/about";

/**
 * The page chrome: navbar, mobile drawer, content column, footer.
 *
 * A client component only because the drawer's open state has to be shared
 * between the navbar's hamburger and the drawer itself. Everything that can be
 * is passed through as a rendered element, so the server still does the work.
 *
 * **One column, capped once.** The chrome used to be a fixed 248px rail beside a
 * `max-w-6xl` container, and the two did not agree: the rail was pinned to the
 * viewport, the container was centred, and the content column was pushed clear
 * of the rail by a margin -- so at 1440px it ran 904px wide with a strip of dead
 * space to its left that belonged to neither. The cap here is the one every page
 * already declared on itself and could never reach.
 *
 * `min-h-dvh` with the content column growing is what keeps the footer at the
 * bottom of a short page rather than halfway up the window. It is also
 * sticky-safe: no transform and no overflow, so the navbar inside it sticks
 * against the document.
 */
export function SiteShell({
  about,
  navbarAccount,
  drawerAccount,
  children,
}: {
  about: AboutData;
  /**
   * The account panel -- sign in, or who is signed in -- already wrapped in its
   * own `<Suspense>` by the layout. Elements rather than a flag because the
   * answer comes from the database and this component is `"use client"`: handing
   * them down keeps the session read on the server, and keeps this file from
   * needing to know what the answer is.
   *
   * Two of them, one per placement, because they are not the same shape: the
   * navbar's opens downward from a control the width of an avatar and the
   * drawer's opens upward across a column.
   */
  navbarAccount?: React.ReactNode;
  drawerAccount?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  return (
    <SearchModalProvider about={about}>
      <div className="flex min-h-dvh flex-col">
        <SiteNavbar
          about={about}
          account={navbarAccount}
          onMenuClick={() => setDrawerOpen(true)}
        />

        <MobileDrawer
          about={about}
          account={drawerAccount}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />

        <div className="mx-auto w-full max-w-7xl grow">
          {/*
            Keyed on the pathname so the entrance animation replays on every
            navigation -- client-side routing keeps the element, so without the
            key it would animate once and never again.

            The 500ms delay that used to precede each navigation is gone. It
            existed so the outgoing page could finish fading before the browser
            left it -- with client-side routing there is no page load to mask,
            so it would be half a second of waiting for nothing.

            Note this element animates a transform, and a transformed ancestor
            becomes the containing block for its position:fixed descendants.
            That is why the search modal, the toast stack and the confirm dialog
            are rendered as siblings of this element and not inside it. The
            navbar and the footer sit outside it for a different reason: neither
            changes between pages, and inside they would fade in again on every
            click.
          */}
          <div key={pathname} id="page-content" className="z-10 w-full">
            {children}
          </div>
        </div>

        <SiteFooter about={about} />
      </div>
    </SearchModalProvider>
  );
}
