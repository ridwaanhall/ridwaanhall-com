"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ICON_BUTTON } from "@/components/foothill/classes";
import { Icon } from "@/components/foothill/icons";
import { Mark } from "@/components/foothill/mark";
import { Roll } from "@/components/foothill/motion";
import { usePalette } from "@/components/foothill/palette";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { AboutData } from "@/lib/data/about";
import { EASE, gsap, MOTION_OK, useGSAP } from "@/lib/motion/gsap";
import { isActive, visibleNavItems, type NavItem } from "@/lib/nav";
import { usePresence } from "@/lib/motion/use-presence";
import { availability, hasOpenhire } from "@/lib/site/display";
import { cn } from "@/lib/utils/cn";

/** The bar's links: the primary navigation without Home, which the mark is. */
function links(about: AboutData): Pick<NavItem, "label" | "href" | "matchNested">[] {
  const items = visibleNavItems().filter((item) => item.href !== "/");
  if (!hasOpenhire(about)) return items;
  // Open-hire sits beside Contact: both are how somebody gets in touch.
  const at = items.findIndex((item) => item.href === "/contact");
  const openhire = { label: "Open-hire", href: "/openhire" as const, matchNested: false };
  return at < 0 ? [...items, openhire] : [...items.slice(0, at), openhire, ...items.slice(at)];
}

/**
 * The site's navigation: one bar across the top.
 *
 * From `lg` it carries every link, the reader's status, search, the theme and
 * the account. Below that it is three round controls -- search, theme, menu --
 * and the links open in a full-screen menu. There is exactly one theme toggle
 * at every width; the menu does not carry a second.
 *
 * It steps out of the way while reading downward and returns the moment the
 * reader scrolls up, and the rule under it appears only once the page has
 * moved, so at the top of a page the bar is part of the paper.
 */
export function Navbar({ about, account }: { about: AboutData; account: React.ReactNode }) {
  return <NavbarAt about={about} account={account} pathname={usePathname()} />;
}

/**
 * The bar before the pathname is known.
 *
 * Under Cache Components `usePathname` suspends while prerendering a route
 * whose params were not listed in advance -- a 404 for an unknown slug is
 * one -- so the shell renders the bar inside `<Suspense>` with this as the
 * fallback: the same bar, with no link marked current.
 */
export function NavbarFallback({ about, account }: { about: AboutData; account: React.ReactNode }) {
  return <NavbarAt about={about} account={account} pathname="" />;
}

function NavbarAt({
  about,
  account,
  pathname,
}: {
  about: AboutData;
  account: React.ReactNode;
  pathname: string;
}) {
  const palette = usePalette();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuAt, setMenuAt] = useState(pathname);
  const header = useRef<HTMLElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const items = links(about);
  const status = availability(about);
  const headline = status.find((line) => line.key === "open") ?? status[0];

  // Leaving the page closes the menu -- during render, so it never paints
  // open over the page it led to.
  if (menuOpen && menuAt !== pathname) {
    setMenuOpen(false);
    setMenuAt(pathname);
  }

  // Hide on the way down, return on the way up.
  useEffect(() => {
    let last = window.scrollY;
    let hidden = false;
    const reduce = !window.matchMedia(MOTION_OK).matches;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      const goingDown = y > last + 4;
      const goingUp = y < last - 4;
      if (goingDown && y > 160 && !hidden) {
        hidden = true;
        gsap.to(header.current, { yPercent: -100, duration: reduce ? 0 : 0.5, ease: "power3.inOut" });
      } else if ((goingUp || y < 160) && hidden) {
        hidden = false;
        gsap.to(header.current, { yPercent: 0, duration: reduce ? 0 : 0.5, ease: EASE });
      }
      if (goingDown || goingUp) last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The underline slides to whichever link is current.
  useGSAP(
    () => {
      const line = indicator.current;
      const current = list.current?.querySelector<HTMLElement>("[aria-current='page']");
      if (!line) return;
      if (!current) {
        gsap.to(line, { autoAlpha: 0, duration: 0.2 });
        return;
      }
      const target = { x: current.offsetLeft, width: current.offsetWidth, autoAlpha: 1 };
      const animate = window.matchMedia(MOTION_OK).matches && gsap.getProperty(line, "opacity") !== 0;
      if (animate) gsap.to(line, { ...target, duration: 0.6, ease: "expo.out" });
      else gsap.set(line, target);
    },
    { dependencies: [pathname] },
  );

  return (
    <>
      <header ref={header} className="fixed inset-x-0 top-0 z-50">
        <div
          className={cn(
            "border-b bg-paper/80 backdrop-blur-md transition-colors duration-300",
            scrolled || menuOpen ? "border-line" : "border-transparent",
          )}
        >
          <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-6 px-4 md:px-8 xl:px-12">
            <Link
              href="/"
              className="group flex items-center gap-2.5 font-display text-[18px] font-semibold tracking-[-0.025em] text-ink"
              aria-label={`${about.username}, home`}
            >
              <Mark className="h-4 w-7 transition-transform duration-500 group-hover:-translate-y-0.5" />
              <Roll>{about.username}</Roll>
            </Link>

            <nav aria-label="Primary" className="hidden lg:block">
              <ul ref={list} className="relative flex items-center gap-7">
                {items.map((item) => {
                  const current = isActive(item, pathname);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={current ? "page" : undefined}
                        className={cn(
                          "block py-2 text-[15px] transition-colors",
                          current ? "text-ink" : "text-mute hover:text-ink",
                        )}
                      >
                        <Roll>{item.label}</Roll>
                      </Link>
                    </li>
                  );
                })}
                <span
                  ref={indicator}
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-0 rounded-full bg-ink opacity-0"
                />
              </ul>
            </nav>

            <div className="flex items-center gap-1 md:gap-1.5">
              {headline && <StatusLink line={headline} className="mr-3 hidden xl:inline-flex" />}
              <button
                type="button"
                  onClick={palette.open}
                aria-label="Search"
                title="Search (Ctrl K)"
                className={ICON_BUTTON}
              >
                <Icon name="search" className="h-[18px] w-[18px] transition-transform duration-500 group-hover:-rotate-12" />
              </button>
              <span className="inline-flex">
                <ThemeToggle className={ICON_BUTTON} iconSize="h-[18px] w-[18px]" />
              </span>
              <div className="ml-2 hidden items-center lg:flex">
                {account}
              </div>
              <button
                type="button"
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="fh-menu"
                onClick={() => {
                  setMenuAt(pathname);
                  setMenuOpen((open) => !open);
                }}
                className={cn(ICON_BUTTON, "lg:hidden")}
              >
                <svg viewBox="0 0 24 24" className="fh-burger h-[18px] w-[18px]" aria-hidden="true">
                  <path d="M3.5 9h17" />
                  <path d="M3.5 15h17" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/*
        Beside the header, never inside it. The header slides away on scroll by
        a transform, and GSAP leaves one on it even at rest -- and a transformed
        ancestor is what a `position: fixed` child is laid out against. Inside,
        the menu's `top-16 bottom-0` resolved against a 64px header and opened
        one pixel tall, so it worked until the first scroll and never after.
      */}
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={items}
        pathname={pathname}
        account={account}
        status={status}
      />
    </>
  );
}

function StatusLink({
  line,
  className,
}: {
  line: ReturnType<typeof availability>[number];
  className?: string;
}) {
  const body = (
    <>
      <span aria-hidden="true" className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ink opacity-60 motion-reduce:hidden" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-ink" />
      </span>
      {line.label}
    </>
  );
  const classes = cn("items-center gap-2 text-[14px] text-mute", className);
  return line.href ? (
    <Link href={line.href} className={cn(classes, "transition-colors hover:text-ink")} title={line.detail}>
      {body}
    </Link>
  ) : (
    <span className={classes} title={line.detail}>
      {body}
    </span>
  );
}

/**
 * The links below `lg`, over the whole page.
 *
 * It leaves the way it arrived (`usePresence`), and is `hidden` once it has
 * gone rather than merely invisible, so its sign-in link and account menu are
 * not a second focusable copy of the ones in the bar.
 */
function MobileMenu({
  open,
  onClose,
  items,
  pathname,
  account,
  status,
}: {
  open: boolean;
  onClose: () => void;
  items: ReturnType<typeof links>;
  pathname: string;
  account: React.ReactNode;
  status: ReturnType<typeof availability>;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const shown = usePresence(open, panel, {
    enter: (tl, el) =>
      tl
        .fromTo(el, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.6, ease: "expo.out" })
        .fromTo(
          el.querySelectorAll("[data-menu-item]"),
          { yPercent: 70, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: EASE, stagger: 0.045 },
          0.12,
        ),
    exit: (tl, el) => {
      const rows = el.querySelectorAll("[data-menu-item]");
      tl.to(rows, { yPercent: -40, autoAlpha: 0, duration: 0.3, ease: "power2.in", stagger: { each: 0.025, from: "end" } })
        .to(el, { clipPath: "inset(0 0 100% 0)", duration: 0.45, ease: "expo.inOut" }, "-=0.15");
    },
  });

  // While open: the page behind holds still, Escape closes, focus starts on
  // the first link.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      id="fh-menu"
      ref={panel}
      hidden={!shown}
      className="fixed inset-x-0 top-16 bottom-0 z-50 overflow-y-auto bg-paper lg:hidden"
    >
      <div className="mx-auto flex min-h-full w-full max-w-[1200px] flex-col px-4 pt-6 pb-10 md:px-8">
        <nav aria-label="Menu">
          <ul className="flex flex-col">
            {[{ label: "Home", href: "/" as const, matchNested: false }, ...items].map((item) => (
              <li key={item.href} data-menu-item className="overflow-hidden border-b border-line">
                <Link
                  href={item.href}
                  aria-current={(item.href === "/" ? pathname === "/" : isActive(item, pathname)) ? "page" : undefined}
                  className="group flex items-center justify-between py-3.5 font-display text-[clamp(1.9rem,1.4rem+3vw,2.75rem)] leading-none font-medium tracking-[-0.03em] text-mute transition-colors hover:text-ink aria-[current=page]:text-ink"
                >
                  <Roll>{item.label}</Roll>
                  <Icon
                    name="arrow-right"
                    className="h-6 w-6 -translate-x-2 text-mute opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 group-aria-[current=page]:translate-x-0 group-aria-[current=page]:opacity-100"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div data-menu-item className="mt-auto flex flex-col gap-6 pt-10">
          {status.length > 0 && (
            <ul className="flex flex-col gap-2">
              {status.map((line) => (
                <li key={line.key}>
                  <StatusLink line={line} className="inline-flex" />
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center">{account}</div>
        </div>
      </div>
    </div>
  );
}
