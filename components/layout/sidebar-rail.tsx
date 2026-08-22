import { VerifiedIcon } from "@/components/icons/nav-icons";
import { NavLinks } from "@/components/layout/nav-links";
import { ProfileAvatar } from "@/components/layout/profile-avatar";
import { SearchTrigger } from "@/components/layout/search-trigger";
import { SidebarFooter } from "@/components/layout/sidebar-footer";
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
 */
export function SidebarRail({ about }: { about: AboutData }) {
  return (
    <div className="hidden z-40 md:flex md:flex-col md:w-62 md:fixed md:inset-y-0 bg-black">
      <div className="w-full px-3 pt-8 pb-4">
        <div className="flex w-full flex-col items-start gap-0.5">
          <ProfileAvatar
            src={about.image_url}
            name={about.name}
            size={60}
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
      <SidebarFooter about={about} />
    </div>
  );
}
