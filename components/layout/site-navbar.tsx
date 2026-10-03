"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

import { SearchIcon } from "@/components/icons/nav-icons";
import { ProfileAvatar } from "@/components/layout/profile-avatar";
import { useSearchModal } from "@/components/layout/search-modal";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { IconFx, RollLabel } from "@/components/motion/interactive";
import { CONTAINER, FOCUS, ICON_BUTTON } from "@/components/site/ui";
import type { AboutData } from "@/lib/data/about";
import { isActive, visibleNavItems } from "@/lib/nav";
import { cn } from "@/lib/utils/cn";

gsap.registerPlugin(useGSAP, ScrollTrigger);


/**
 * The site's navigation, across the top.
 *
 * It replaced a fixed left rail. Three behaviours, all GSAP:
 *
 * - **It steps aside while reading.** Scrolling down past the first screen
 *   slides it up out of view; any scroll up brings it back. Once the page has
 *   left the top it takes a blurred veil of the canvas rather than a rule, so
 *   text passing beneath it is muted rather than cut off by a line.
 * - **The current page is underlined by one moving rule**, not by a style on
 *   each link, so a navigation slides the rule to its new place instead of
 *   one underline vanishing and another appearing.
 * - Below `lg` the links collapse into the menu button, and the one theme
 *   toggle stays in the bar at every width -- `scripts/check-breakpoints.mjs`
 *   counts it.
 *
 * Fixed rather than sticky, and rendered outside `#page-content`, because that
 * element animates and would otherwise become this bar's containing block.
 */
export function SiteNavbar({
  about,
  account,
  menuOpen,
  onOpenMenu,
}: {
  about: AboutData;
  account?: React.ReactNode;
  menuOpen: boolean;
  onOpenMenu: () => void;
}) {
  const pathname = usePathname();
  const header = useRef<HTMLElement>(null);
  const linksRef = useRef<HTMLUListElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const { open: openSearch } = useSearchModal();
  const items = visibleNavItems().filter((item) => item.href !== "/");

  // Hide on the way down, show on the way up.
  useGSAP(
    () => {
      const bar = header.current;
      if (!bar) return;
      const show = gsap.quickTo(bar, "yPercent", { duration: 0.45, ease: "power3.out" });
      const trigger = ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate(self) {
          const y = self.scroll();
          bar.dataset.scrolled = y > 8 ? "true" : "false";
          const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          if (reduce) return;
          show(self.direction === 1 && y > 240 ? -100 : 0);
        },
      });
      // Tabbing into the bar while it is out of view brings it back: a focused
      // control the reader cannot see is worse than no animation at all.
      const reveal = () => show(0);
      bar.addEventListener("focusin", reveal);
      return () => {
        trigger.kill();
        bar.removeEventListener("focusin", reveal);
      };
    },
    { scope: header },
  );

  // A menu that opens over the page always has its bar on screen to close it.
  useGSAP(
    () => {
      if (menuOpen && header.current) gsap.to(header.current, { yPercent: 0, duration: 0.3 });
    },
    { dependencies: [menuOpen] },
  );

  // Slide the rule under whichever link is current.
  useGSAP(
    () => {
      const list = linksRef.current;
      const rule = indicator.current;
      if (!list || !rule) return;
      const place = (animate: boolean) => {
        const active = list.querySelector<HTMLElement>("[aria-current='page']");
        if (!active) {
          gsap.to(rule, { opacity: 0, duration: animate ? 0.2 : 0 });
          return;
        }
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        gsap.to(rule, {
          x: active.offsetLeft,
          width: active.offsetWidth,
          opacity: 1,
          duration: animate && !reduce ? 0.5 : 0,
          ease: "expo.out",
        });
      };
      place(rule.style.opacity !== "");
      const onResize = () => place(false);
      window.addEventListener("resize", onResize);
      // The web font arrives after first layout and changes every link's width.
      document.fonts?.ready.then(() => place(false));
      return () => window.removeEventListener("resize", onResize);
    },
    { dependencies: [pathname] },
  );

  return (
    <header ref={header} data-site-header className="site-header fixed inset-x-0 top-0 z-40">
      <div className={cn(CONTAINER, "flex h-16 items-center gap-6")}>
        <Link
          href="/"
          aria-label={`${about.name}, home`}
          className="group flex min-w-0 items-center gap-2.5 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-400"
        >
          <ProfileAvatar
            src={about.image_url}
            name={about.name}
            size={28}
            eager
            className="transition-transform duration-500 group-hover:scale-110"
          />
          <span className="truncate text-[0.9375rem] font-[580] tracking-[-0.02em] text-zinc-100 [font-stretch:110%]">
            <RollLabel press={false}>{about.name}</RollLabel>
          </span>
        </Link>

        <nav aria-label="Main" className="ml-auto hidden lg:block">
          <ul ref={linksRef} className="relative flex items-center gap-7">
            {items.map((item) => {
              const active = isActive(item, pathname);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-full py-5 text-sm transition-colors duration-300",
                      FOCUS,
                      active ? "text-zinc-100" : "text-zinc-400 hover:text-zinc-100",
                    )}
                  >
                    <RollLabel press={false}>{item.label}</RollLabel>
                  </Link>
                </li>
              );
            })}
            <span ref={indicator} className="nav-indicator" aria-hidden="true" />
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <button type="button" onClick={openSearch} aria-label="Search" className={ICON_BUTTON}>
            <IconFx>
              <SearchIcon className="h-[18px] w-[18px]" />
            </IconFx>
          </button>
          <ThemeToggle iconSize="h-[18px] w-[18px]" className={ICON_BUTTON} />
          <div className="group/acct ml-2 hidden lg:block" data-account-slot="bar">
            {account}
          </div>
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            className={cn(ICON_BUTTON, "lg:hidden")}
          >
            <IconFx>
              <MenuIcon />
            </IconFx>
          </button>
        </div>
      </div>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" aria-hidden="true" className="h-5 w-5">
      <path d="M4 8h16M4 16h16" />
    </svg>
  );
}
