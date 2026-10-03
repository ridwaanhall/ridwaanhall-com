"use client";

import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";

import { BackToTop } from "@/components/layout/back-to-top";
import { SearchModalProvider } from "@/components/layout/search-modal";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteMenu } from "@/components/layout/site-menu";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { PageMotion } from "@/components/motion/page-motion";
import type { AboutData } from "@/lib/data/about";

/**
 * The page chrome: a navbar across the top, the page, a footer.
 *
 * It used to be a fixed left rail with a bottom-sheet drawer below `md`. The
 * redesign puts navigation where a reader looks for it first and gives the
 * content the full width of one centred column.
 *
 * A client component only because the menu's open state is shared between the
 * navbar's button and the menu itself. The account panel arrives from the
 * layout as an already-suspended element and is rendered twice -- in the bar
 * from `lg` up, in the menu below it -- so the session read stays on the
 * server and this file never needs to know its answer.
 *
 * **Exactly one theme toggle is visible at any width**: the bar's, which never
 * hides. `scripts/check-breakpoints.mjs` verifies it.
 */
export function SiteShell({
  about,
  account,
  children,
}: {
  about: AboutData;
  account?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAt, setMenuAt] = useState(pathname);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Navigating closes the menu, decided in the render that already knows the
  // route changed -- an effect would paint the menu once over the new page.
  if (menuAt !== pathname) {
    setMenuAt(pathname);
    if (menuOpen) setMenuOpen(false);
  }

  return (
    <SearchModalProvider about={about}>
      <div className="site-root flex min-h-dvh flex-col">
        <SiteNavbar
          about={about}
          account={account}
          menuOpen={menuOpen}
          onOpenMenu={() => setMenuOpen(true)}
        />
        <SiteMenu about={about} account={account} open={menuOpen} onClose={closeMenu} />

        {/*
          Keyed on the pathname so each navigation mounts a fresh page: the
          entrance fade in styles/animations.css replays, and PageMotion's
          triggers and splits belong to exactly one page.

          This element animates, and an animated ancestor becomes the
          containing block for `position: fixed` descendants -- which is why
          the navbar, the menu, the search modal, the toast stack and the
          confirm dialog all render as siblings of it rather than inside.
        */}
        <div key={pathname} id="page-content" className="flex-1 pt-16">
          <PageMotion>{children}</PageMotion>
        </div>

        <SiteFooter about={about} />
        <BackToTop />
      </div>
    </SearchModalProvider>
  );
}
