"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { Navbar, NavbarFallback } from "@/components/foothill/navbar";
import { PaletteProvider } from "@/components/foothill/palette";
import type { AboutData } from "@/lib/data/about";

/**
 * The public site's frame: the navbar, the page, the footer.
 *
 * `#page-content` is keyed on the pathname so every navigation mounts a fresh
 * page -- two posts share one page component, and without the key moving
 * from one to the other would keep the first one's motion state. Toasts, the
 * confirm dialog and the loading bar live outside it at body level, and
 * `scripts/check-notifications.mjs` holds them there.
 *
 * Both readers of the pathname sit inside `<Suspense>`. Under Cache
 * Components `usePathname` suspends while prerendering a route whose params
 * were not listed in advance, and outside a boundary that blocks the whole
 * route; each fallback is the same thing without the pathname -- the bar with
 * nothing marked current, the page without its key.
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
        <Suspense fallback={<PageFrame>{children}</PageFrame>}>
          <KeyedPage>{children}</KeyedPage>
        </Suspense>
        {footer}
      </div>
    </PaletteProvider>
  );
}

function KeyedPage({ children }: { children: React.ReactNode }) {
  return <PageFrame key={usePathname()}>{children}</PageFrame>;
}

function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div id="page-content" className="flex-1">
      <div>{children}</div>
    </div>
  );
}
