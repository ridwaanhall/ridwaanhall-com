"use client";

import { Suspense } from "react";

import { Navbar, NavbarFallback } from "@/components/foothill/navbar";
import { PaletteProvider } from "@/components/foothill/palette";
import { Cursor } from "@/components/foothill/cursor";
import { ScrollTop } from "@/components/foothill/scroll-top";
import type { AboutData } from "@/lib/data/about";

/**
 * The public site's frame: the navbar, the page, the footer, and the way back
 * to the top.
 *
 * `#page-content` is not keyed on the pathname. The router already mounts a
 * fresh page whenever a segment changes -- two posts are two cache keys -- and
 * a key would have to read the pathname, which under Cache Components means a
 * `<Suspense>` whose fallback is the whole page: every document then carried
 * its content twice. Toasts, the confirm dialog and the loading bar live
 * outside it at body level, and `scripts/check-notifications.mjs` holds them
 * there.
 *
 * The navbar is the one reader of the pathname, and it sits inside
 * `<Suspense>`: `usePathname` suspends while prerendering a route whose params
 * were not listed in advance, and outside a boundary that blocks the whole
 * route. Its fallback is the same bar with nothing marked current.
 *
 * The footer arrives as a rendered server component, so its links and the
 * build year cost the client nothing.
 */
export function SiteShell({
  about,
  account,
  footer,
  children,
}: {
  about: AboutData;
  account: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <PaletteProvider about={about}>
      <div className="fh-site flex min-h-dvh flex-col bg-paper text-ink">
        <a
          href="#page-content"
          className="sr-only z-[60] rounded-md bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <Suspense fallback={<NavbarFallback about={about} account={account} />}>
          <Navbar about={about} account={account} />
        </Suspense>
        <div id="page-content" tabIndex={-1} className="flex-1 outline-none">
          <div>{children}</div>
        </div>
        {footer}
        <ScrollTop />
        <Cursor />
      </div>
    </PaletteProvider>
  );
}
