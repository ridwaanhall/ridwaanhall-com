"use client";

import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { EASE } from "@/components/foothill/controls";
import { Icon, type IconName } from "@/components/foothill/icons";
import { usePalette } from "@/components/foothill/palette";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { AboutData } from "@/lib/data/about";
import { useLockedPage } from "@/lib/motion/use-locked-page";
import { isActive, visibleNavItems } from "@/lib/nav";
import { hasOpenhire } from "@/lib/site/display";
import { cn } from "@/lib/utils/cn";

/** Each page's own glyph, beside it in the phone menu. */
export const PAGE_ICON: Record<string, IconName> = {
  "/": "home",
  "/projects": "grid",
  "/blog": "pen",
  "/about": "user",
  "/dashboard": "chart",
  "/guestbook": "msg",
  "/contact": "mail",
  "/openhire": "briefcase",
  "/privacy-policy": "file",
  "/terms": "file",
};

function Roll({ children }: { children: string }) {
  return (
    <span className="roll">
      <span>{children}</span>
    </span>
  );
}

/**
 * The site's navigation: one sticky bar, in the flow of the page.
 *
 * From `lg` it carries every link, a search field that is a button, the theme
 * and the account. Below that it is three icon buttons -- search, theme,
 * menu -- and the links open in a sheet over the page. There is exactly one
 * theme toggle at every width (`scripts/check-breakpoints.mjs`).
 *
 * The rule under it appears once the page has moved, and an ink line along
 * that rule fills as the page is read.
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

function NavbarAt({ about, account, pathname }: { about: AboutData; account: React.ReactNode; pathname: string }) {
  const palette = usePalette();
  const [menu, setMenu] = useState(false);
  const [menuAt, setMenuAt] = useState(pathname);
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  const items = visibleNavItems().filter((item) => item.href !== "/");

  // Leaving the page closes the menu -- during render, so it never paints
  // open over the page it led to.
  if (menu && menuAt !== pathname) {
    setMenu(false);
    setMenuAt(pathname);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useLockedPage(menu, () => setMenu(false));

  const sheet = [
    { label: "Home", href: "/" as const, matchNested: false },
    ...items,
    ...(hasOpenhire(about) ? [{ label: "Open-hire", href: "/openhire" as const, matchNested: false }] : []),
  ];

  return (
    <>
      <header className={cn("nav", (scrolled || menu) && "scrolled")}>
        <div className="wrap nav-in">
          <Link className="brand" href="/" aria-label={`${about.username}, home`}>
            <Roll>{about.username}</Roll>
          </Link>
          <nav className="links" aria-label="Primary">
            {items.map((item) => {
              const on = isActive(item, pathname);
              return (
                <Link key={item.href} href={item.href} className={on ? "on" : undefined} aria-current={on ? "page" : undefined}>
                  <Roll>{item.label}</Roll>
                </Link>
              );
            })}
          </nav>
          <div className="tools">
            <button type="button" className="ib only-s" onClick={palette.open} aria-label="Search">
              <Icon name="search" size={18} />
            </button>
            <button type="button" className="kbtn" onClick={palette.open} aria-label="Search">
              <Icon name="search" size={15} />
              Search
              <kbd>Ctrl K</kbd>
            </button>
            <ThemeToggle className="ib" />
            <div className="acct-slot">{account}</div>
            <button
              type="button"
              className="ib only-s"
              onClick={() => {
                setMenuAt(pathname);
                setMenu(!menu);
              }}
              aria-expanded={menu}
              aria-controls="fh-menu"
              aria-label={menu ? "Close menu" : "Open menu"}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={menu ? "x" : "menu"}
                  initial={{ opacity: 0, rotate: -45 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 45 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: "grid" }}
                >
                  <Icon name={menu ? "x" : "menu"} size={20} />
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
        <motion.div className="progress" style={{ scaleX: progress }} aria-hidden="true" />
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div
            id="fh-menu"
            key="sheet"
            className="sheet"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.55, ease: [0.7, 0, 0.2, 1] }}
          >
            <nav aria-label="Menu">
              {sheet.map((item, index) => {
                const on = item.href === "/" ? pathname === "/" : isActive(item, pathname);
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + index * 0.04, duration: 0.5, ease: EASE }}
                  >
                    <Link href={item.href} className={cn("big", on && "on")} aria-current={on ? "page" : undefined}>
                      <span>{item.label}</span>
                      <Icon name={PAGE_ICON[item.href] ?? "file"} size={22} />
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
            <motion.div className="sheet-foot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
              <div className="sheet-acct-slot">{account}</div>
              <div className="row-meta">
                <Link className="ul" href="/privacy-policy">
                  Privacy
                </Link>
                <Link className="ul" href="/terms">
                  Terms
                </Link>
                <span>
                  {about.location.residency || about.location.regency}, {about.location.country || "Indonesia"}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
