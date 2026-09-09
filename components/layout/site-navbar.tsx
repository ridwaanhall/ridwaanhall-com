"use client";

import { HamburgerIcon, VerifiedIcon } from "@/components/icons/nav-icons";
import { NavLinks } from "@/components/layout/nav-links";
import { ProfileAvatar } from "@/components/layout/profile-avatar";
import { SearchTrigger } from "@/components/layout/search-trigger";
import { StatusBadges } from "@/components/layout/status-badges";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { AboutData } from "@/lib/data/about";

/**
 * The site's navigation, in one bar at every width.
 *
 * This replaced a 248px column fixed to the left edge of the window. The column
 * was not only dated: the shell it sat beside was centred and capped narrower
 * than the pages inside it, so on a 1440px screen the content had 904px to work
 * with and 144px of the gap between the two belonged to nothing at all.
 *
 * **One header, not two.** A compact bar below `lg` and a full one above it were
 * always going to be one element wearing two coats, and writing them as two
 * would have meant two theme toggles again -- the invariant that exactly one is
 * visible held only as long as two `hidden` rules stayed exactly complementary,
 * with nothing but a harness between the site and a band with two or none. There
 * is one toggle in the document now, and the drawer deliberately has none, so
 * the invariant is a fact about the markup rather than a coincidence of
 * breakpoints. One `<header>` is also one `banner` landmark, and one non-lazy
 * avatar.
 *
 * **What appears when, and why it is not all at `lg`.** Seven labelled links,
 * the avatar, a search box, the toggle and the account together want more than
 * the 960px a `lg` row has. So the row earns its parts back as it widens: links
 * from `lg`, the name and the spelled-out search box from `xl`, the availability
 * chips from `2xl`. Below `lg` it is the avatar, the name, the toggle and the
 * hamburger, which is what it always was. `check-breakpoints.mjs` measures the
 * row at each boundary and fails if it ever wraps -- the budget above is an
 * estimate and that assertion is the truth.
 *
 * **Sticky rather than fixed.** Fixed needed the content below it padded down by
 * hand, and that padding outlived the header it was compensating for: it was
 * dropped at `lg` while the header stopped at `md`, so every tablet carried 80px
 * of blank space above nothing. In flow, there is nothing to compensate.
 */
export function SiteNavbar({
  about,
  account,
  onMenuClick,
}: {
  about: AboutData;
  /**
   * The account panel for this placement -- an element, already suspended by the
   * layout, because the answer needs the session and this file is `"use client"`.
   * The drawer is handed its own copy: one element cannot open downward from an
   * avatar here and upward across a column there.
   */
  account?: React.ReactNode;
  onMenuClick: () => void;
}) {
  return (
    <header
      data-site-navbar
      className="sticky top-0 z-40 border-b border-zinc-800 bg-black/80 backdrop-blur-sm"
    >
      {/*
        Cap and gutter on one element, and the same pair every page uses. Nested
        -- a cap wrapping a padded child -- the navbar's contents would start a
        gutter's width inside the page's, and the two edges would part company on
        any screen wide enough to reach the cap.
      */}
      <div
        data-navbar-row
        className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 md:px-6 lg:h-16 lg:gap-4 lg:px-8"
      >
        {/* Above the fold at every width, and the only non-lazy avatar the
            chrome has left. */}
        <ProfileAvatar src={about.image_url} name={about.name} size={40} eager />

        {/* On below `lg`, off at `lg` where the links need the room, back at
            `xl`. `min-w-0` and `truncate` are what make the name the thing that
            yields to a long one rather than the nav. */}
        <div className="flex min-w-0 items-center gap-2 lg:hidden xl:flex">
          <div className="truncate text-lg font-medium text-zinc-200">{about.name}</div>
          <VerifiedIcon className="text-blue-400 w-5 h-5 shrink-0" />
        </div>

        <StatusBadges about={about} variant="navbar" />

        <NavLinks variant="row" />

        <div className="ml-auto flex shrink-0 items-center gap-0.5 lg:gap-2">
          <div className="hidden lg:block">
            <SearchTrigger variant="compact" />
          </div>

          {/* The site's one theme toggle. It keeps the drawer's size below `lg`,
              where it is one of two large controls, and comes down to the size
              of the row's other glyphs above it. */}
          <ThemeToggle iconSize="h-6 w-6 lg:h-5 lg:w-5" />

          <div className="hidden lg:block">{account}</div>

          {/* Toggle and hamburger are a matched pair -- same padding, radius and
              hover treatment, so they read as one control group. */}
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex items-center justify-center rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 lg:hidden"
            aria-label="Open Sidebar"
          >
            <HamburgerIcon />
          </button>
        </div>
      </div>
    </header>
  );
}
