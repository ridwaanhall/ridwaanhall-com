"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { AboutData } from "@/lib/data/about";
import { isActive, visibleNavItems } from "@/lib/nav";
import { cn } from "@/lib/utils/cn";

import { IconFx, RollLabel } from "@/components/motion/interactive";
import { CONTAINER, FOCUS, ICON_BUTTON } from "@/components/site/ui";

gsap.registerPlugin(useGSAP);

/**
 * The navigation below `lg`: the whole screen, links set large.
 *
 * Opening wipes the panel down from the bar and lets each link rise out of its
 * own mask, staggered; closing plays the panel back up. GSAP owns both, and a
 * reader who prefers reduced motion gets the panel with no travel at all.
 *
 * The panel is `hidden` whenever it is not on screen and `inert` while it is
 * leaving, so a closed menu is neither visible to a screen reader nor
 * reachable by Tab -- the two things the old drawer's `tabIndex` juggling was
 * standing in for. Escape closes it and focus returns to the button that
 * opened it.
 *
 * The account row is the same element the bar renders from `lg` up, handed
 * down from the layout; exactly one of the two is ever visible.
 */
export function SiteMenu({
  about,
  account,
  open,
  onClose,
}: {
  about: AboutData;
  account?: React.ReactNode;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(open);
  const items = visibleNavItems();

  // Mounted the render it is asked for, unmounted only once the closing wipe
  // has finished. Navigating closes it; the shell owns that.
  if (open && !mounted) setMounted(true);

  useGSAP(
    () => {
      const el = panel.current;
      if (!el || !mounted) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const links = el.querySelectorAll("[data-menu-link]");
      const rest = el.querySelectorAll("[data-menu-fade]");

      if (open) {
        gsap
          .timeline()
          .fromTo(
            el,
            { clipPath: "inset(0% 0% 100% 0%)" },
            { clipPath: "inset(0% 0% 0% 0%)", duration: reduce ? 0 : 0.6, ease: "expo.inOut" },
          )
          .fromTo(
            links,
            { yPercent: reduce ? 0 : 110 },
            { yPercent: 0, duration: reduce ? 0 : 0.8, ease: "expo.out", stagger: 0.05 },
            reduce ? 0 : "-=0.25",
          )
          .fromTo(rest, { opacity: 0 }, { opacity: 1, duration: reduce ? 0 : 0.5 }, "<0.2");
        closeButton.current?.focus();
      } else {
        gsap.to(el, {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: reduce ? 0 : 0.45,
          ease: "expo.inOut",
          onComplete: () => setMounted(false),
        });
      }
    },
    { dependencies: [open, mounted], scope: panel },
  );

  // Scroll lock while anything of it is on screen.
  useEffect(() => {
    if (!mounted) return;
    document.body.classList.add("overflow-hidden");
    return () => document.body.classList.remove("overflow-hidden");
  }, [mounted]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onClose();
      document.querySelector<HTMLElement>("[aria-controls='site-menu']")?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div
      ref={panel}
      id="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      hidden={!mounted}
      inert={!open}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-black lg:hidden"
    >
      <div className={cn(CONTAINER, "flex h-16 shrink-0 items-center justify-between")}>
        <span className="text-[0.9375rem] font-[580] tracking-[-0.02em] text-zinc-100 [font-stretch:110%]">{about.name}</span>
        <button
          ref={closeButton}
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className={ICON_BUTTON}
        >
          <IconFx>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" aria-hidden="true" className="h-5 w-5">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </IconFx>
        </button>
      </div>

      <nav aria-label="Main" className={cn(CONTAINER, "flex-1 pt-6")}>
        <ul className="flex flex-col">
          {items.map((item) => {
            const active = isActive(item, pathname);
            return (
              <li key={item.href} className="overflow-hidden">
                <Link
                  href={item.href}
                  data-menu-link
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "type-title flex items-baseline justify-between rounded-2xl py-2 transition-colors duration-300",
                    FOCUS,
                    active ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-100",
                  )}
                >
                  {item.label}
                  {active && <span className="type-meta text-zinc-500">current</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div data-menu-fade className={cn(CONTAINER, "shrink-0 space-y-6 pt-10 pb-8")}>
        <div className="group/acct" data-account-slot="menu">
          {account}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-500">
          <Link href="/privacy-policy" className={cn("rounded-full transition-colors hover:text-zinc-200", FOCUS)}>
            <RollLabel>Privacy</RollLabel>
          </Link>
          <Link href="/terms" className={cn("rounded-full transition-colors hover:text-zinc-200", FOCUS)}>
            <RollLabel>Terms</RollLabel>
          </Link>
          {(about.is_open_to_work || about.is_hiring) && (
            <Link href="/openhire" className={cn("rounded-full transition-colors hover:text-zinc-200", FOCUS)}>
              <RollLabel>OpenHire</RollLabel>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
