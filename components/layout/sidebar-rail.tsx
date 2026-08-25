import { VerifiedIcon } from "@/components/icons/nav-icons";
import { NavLinks } from "@/components/layout/nav-links";
import { ProfileAvatar } from "@/components/layout/profile-avatar";
import { SearchTrigger } from "@/components/layout/search-trigger";
import { SIDEBAR_BASE, SidebarFooter } from "@/components/layout/sidebar-footer";
import { StatusBadges } from "@/components/layout/status-badges";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { AboutData } from "@/lib/data/about";

/**
 * The desktop sidebar rail.
 *
 * **One header at every width it is visible.** The rail is `w-62` (248px) from
 * `md` up, so there was never a reason for `md` to differ from `lg` -- but it
 * used to: `md` laid the avatar beside the name and dropped `@username` and the
 * status badges entirely, so a tablet reader got a different profile block than
 * a desktop one and could not see the hiring status the mobile drawer showed
 * them. It is stacked throughout: avatar, name, `@username` + toggle, badges,
 * with every element sharing the `px-3` left edge the search box and nav items
 * already used.
 *
 * **Everything above the base scrolls.** The rail is pinned to the full
 * height of the window, and on a short one -- a laptop with the browser
 * chrome and a dock, or any window dragged shorter -- the profile block, the
 * search box and eight nav items do not fit. There was no overflow handling,
 * so Guestbook and Contact were simply cut off with nothing to say they were
 * there. The scroll region ends above `SidebarFooter`, which stays put: who is
 * signed in, the way in or out of a session and the legal links are the last
 * things that should disappear, and pinning them is what makes the scroll
 * appear exactly when the nav would otherwise run into them.
 *
 * `min-h-0` on the scroll region is load-bearing. A flex child's `min-height`
 * defaults to `auto`, which is its content height, so without it the region
 * refuses to shrink, `overflow-y-auto` never has anything to do, and the
 * footer is pushed off the bottom instead -- the same trap as the `min-w-0`
 * on the admin form's field rows.
 */
export function SidebarRail({
  about,
  account,
}: {
  about: AboutData;
  account?: React.ReactNode;
}) {
  return (
    <div className="hidden z-40 md:flex md:flex-col md:w-62 md:fixed md:inset-y-0 bg-black">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto custom-scroll">
        <div className="w-full px-3 pt-8 pb-4">
          <div className="flex w-full flex-col items-start gap-0.5">
            {/*
              `priority` for the same reason the mobile navbar's copy carries
              it: from `md` up this rail is the header, and its photo is the
              largest thing painted above the fold -- Next reported it as the
              Largest Contentful Paint and asked for exactly this.
            */}
            <ProfileAvatar
              src={about.image_url}
              name={about.name}
              size={60}
              priority
              className="duration-700 ease-in-out scale-100 hover:scale-105"
            />

            <div className="mt-4 flex items-center gap-2">
              <h2 className="text-lg font-medium lg:text-xl">{about.name}</h2>
              <VerifiedIcon className="text-blue-400" height={18} width={18} />
            </div>

            {/* The rail's single theme toggle lives here. `bare` because a hover
                chip beside text would read as a second control. */}
            <div className="flex items-center justify-between w-full gap-2">
              <div className="text-[15px] text-zinc-400 hover:text-zinc-300 transition-all duration-300">
                @{about.username}
              </div>
              <ThemeToggle bare />
            </div>

            <StatusBadges about={about} variant="rail" />
          </div>
        </div>

        <SearchTrigger />
        <NavLinks />
      </div>

      {/* Outside the scroll region: who is signed in, the way in or out of a
          session and the legal links are the last things that should scroll
          away when a short window pushes the nav into overflow. */}
      <div className={SIDEBAR_BASE}>
        {account}
        <SidebarFooter about={about} />
      </div>
    </div>
  );
}
