"use client";

import { usePathname } from "next/navigation";

import { Navbar } from "@/components/foothill/navbar";
import { PaletteProvider } from "@/components/foothill/palette";
import type { AboutData } from "@/lib/data/about";

/**
 * The public site's frame: the navbar, the page, the footer.
 *
 * `#page-content` is keyed on the pathname so every navigation mounts a fresh
 * page -- that is what lets `PageMotion` treat each arrival as a first paint.
 * Toasts, the confirm dialog and the loading bar live outside it at body
 * level, and `scripts/check-notifications.mjs` holds them there.
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
  const pathname = usePathname();

  return (
    <PaletteProvider about={about}>
      <div className="fh-site flex min-h-dvh flex-col bg-paper text-ink">
        <a
          href="#page-content"
          className="sr-only z-[60] rounded-md bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <Navbar about={about} account={account} />
        <div key={pathname} id="page-content" className="flex-1">
          <div>{children}</div>
        </div>
        {footer}
      </div>
    </PaletteProvider>
  );
}
