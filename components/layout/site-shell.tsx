"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

import { HamburgerIcon, VerifiedIcon } from "@/components/icons/nav-icons";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { ProfileAvatar } from "@/components/layout/profile-avatar";
import { SearchModalProvider } from "@/components/layout/search-modal";
import { SidebarRail } from "@/components/layout/sidebar-rail";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { AboutData } from "@/lib/data/about";

/**
 * The page chrome: mobile navbar, mobile drawer, desktop rail, content column.
 *
 * A client component only because the drawer's open state has to be shared
 * between the navbar's hamburger and the drawer itself. The rail and its
 * children are passed through as rendered elements where they can be, so the
 * server still does the work.
 *
 * **Exactly one theme toggle is visible at any width**: the navbar's below
 * `md`, the rail's from `md` up. Nothing in CI catches a breakpoint band with
 * none or two, so verify 375 / 767 / 768 / 900 / 1023 / 1024 / 1440 after
 * changing either.
 */
export function SiteShell({
  about,
  account,
  children,
}: {
  about: AboutData;
  /**
   * The account panel -- sign in, or who is signed in -- already wrapped in its
   * own `<Suspense>` by the layout. An element rather than a flag because the
   * answer comes from the database and this component is `"use client"`:
   * handing the element down keeps the session read on the server, and keeps
   * this file from needing to know what the answer is.
   */
  account?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  return (
    <SearchModalProvider about={about}>
      <header className="md:hidden bg-black border-b border-zinc-800 fixed top-0 left-0 w-full z-40">
        <div className="flex items-center gap-3 p-4">
          <ProfileAvatar src={about.image_url} name={about.name} size={40} eager />
          <div className="flex items-center gap-2">
            <div className="text-lg font-medium text-zinc-200">{about.name}</div>
            <VerifiedIcon className="text-blue-400 w-5 h-5" />
          </div>
          {/* Toggle and hamburger are a matched pair -- same padding, radius and
              hover treatment, so they read as one control group. */}
          <div className="ml-auto flex items-center gap-0.5">
            <ThemeToggle iconSize="h-6 w-6" />
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center justify-center rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
              aria-label="Open Sidebar"
            >
              <HamburgerIcon />
            </button>
          </div>
        </div>
      </header>

      <MobileDrawer
        about={about}
        account={account}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <div className="mx-auto max-w-6xl pt-20 lg:pt-0">
        <div className="flex flex-col lg:flex-row lg:gap-2 lg:py-4 xl:pb-8">
          <SidebarRail about={about} account={account} />
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
            That is why the search modal, and later the toast stack and confirm
            dialog, are rendered as siblings of this element and not inside it.
          */}
          <div key={pathname} id="page-content" className="z-10 w-full">
            <div className="flex-1 md:ml-62">{children}</div>
          </div>
        </div>
      </div>
    </SearchModalProvider>
  );
}
