"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Mark } from "@/components/foothill/mark";
import { usePalette } from "@/components/foothill/palette";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { AboutData } from "@/lib/data/about";
import { EASE, gsap, MOTION_OK, useGSAP } from "@/lib/motion/gsap";
import { isActive, visibleNavItems, type NavItem } from "@/lib/nav";
import { availability, hasOpenhire } from "@/lib/site/display";
import { cn } from "@/lib/utils/cn";

const TOGGLE =
  "group inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-mute transition-colors hover:bg-raise hover:text-ink";

/** The bar's links: the primary navigation without Home, which the mark is. */
function links(about: AboutData): (Pick<NavItem, "label" | "href" | "matchNested">)[] {
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
 * the account. Below that it keeps the mark, search, the theme and a Menu
 * button, and the links open in a full-screen menu. There is exactly one theme
 * toggle at every width -- the menu does not carry a second.
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
        gsap.to(header.current, { yPercent: -100, duration: reduce ? 0 : 0.45, ease: EASE });
      } else if ((goingUp || y < 160) && hidden) {
        hidden = false;
        gsap.to(header.current, { yPercent: 0, duration: reduce ? 0 : 0.45, ease: EASE });
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
      if (animate) gsap.to(line, { ...target, duration: 0.5, ease: EASE });
      else gsap.set(line, target);
    },
    { dependencies: [pathname] },
  );

  return (
    <header ref={header} className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          "border-b bg-paper/85 backdrop-blur-md transition-colors duration-300",
          scrolled || menuOpen ? "border-line" : "border-transparent",
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-6 px-4 md:px-8 xl:px-12">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-[17px] font-semibold tracking-[-0.02em] text-ink"
            aria-label={`${about.username}, home`}
          >
            <Mark className="h-4 w-7" />
            <span>{about.username}</span>
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
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              <span
                ref={indicator}
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-0 rounded-full bg-sulfur-mark opacity-0"
              />
            </ul>
          </nav>

          <div className="flex items-center gap-1.5 md:gap-3">
            {headline && (
              <StatusLink line={headline} className="mr-2 hidden xl:inline-flex" />
            )}
            <button
              type="button"
              onClick={palette.open}
              className="flex h-9 cursor-pointer items-center gap-2 rounded-full px-2.5 text-[14px] text-mute transition-colors hover:bg-raise hover:text-ink"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M13.5 13.5 L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="sr-only md:not-sr-only">Search</span>
              <kbd className="fh-mono hidden rounded border border-line px-1.5 text-[10px] leading-[18px] text-mute md:inline">
                ⌘K
              </kbd>
            </button>
            <ThemeToggle className={TOGGLE} />
            <div className="hidden items-center lg:flex">{account}</div>
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="fh-menu"
              onClick={() => {
                setMenuAt(pathname);
                setMenuOpen((open) => !open);
              }}
              className="flex h-9 cursor-pointer items-center gap-2 rounded-full pl-2 text-[14px] text-ink lg:hidden"
            >
              <span>{menuOpen ? "Close" : "Menu"}</span>
              <span aria-hidden="true" className="relative block h-3 w-4">
                <span
                  className={cn(
                    "absolute left-0 h-px w-4 bg-ink transition-transform duration-300",
                    menuOpen ? "top-1.5 rotate-45" : "top-0.5",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 h-px w-4 bg-ink transition-transform duration-300",
                    menuOpen ? "top-1.5 -rotate-45" : "top-2.5",
                  )}
                />
              </span>
            </button>
          </div>
        </div>
      </div>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={items}
        pathname={pathname}
        account={account}
        status={status}
      />
    </header>
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
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sulfur-mark opacity-60 motion-reduce:hidden" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-sulfur-mark" />
      </span>
      {line.label}
    </>
  );
  const classes = cn("items-center gap-2 text-[13px] text-mute", className);
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
 * `hidden` while closed rather than merely invisible, so its sign-in link and
 * account menu are not a second focusable copy of the ones in the bar.
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

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.from(panel.current, { autoAlpha: 0, duration: 0.25 });
      gsap.from("[data-menu-item]", {
        yPercent: 60,
        autoAlpha: 0,
        duration: 0.6,
        ease: EASE,
        stagger: 0.045,
      });
    });

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      mm.revert();
    };
  }, [open, onClose]);

  return (
    <div
      id="fh-menu"
      ref={panel}
      hidden={!open}
      className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto bg-paper lg:hidden"
    >
      <div className="mx-auto flex min-h-full w-full max-w-[1200px] flex-col px-4 pt-8 pb-10 md:px-8">
        <nav aria-label="Menu">
          <ul className="flex flex-col">
            <li data-menu-item>
              <Link
                href="/"
                aria-current={pathname === "/" ? "page" : undefined}
                className="block border-b border-line py-3.5 text-[30px] font-medium tracking-[-0.02em] text-ink aria-[current=page]:text-sulfur"
              >
                Home
              </Link>
            </li>
            {items.map((item) => (
              <li key={item.href} data-menu-item>
                <Link
                  href={item.href}
                  aria-current={isActive(item, pathname) ? "page" : undefined}
                  className="block border-b border-line py-3.5 text-[30px] font-medium tracking-[-0.02em] text-ink aria-[current=page]:text-sulfur"
                >
                  {item.label}
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
