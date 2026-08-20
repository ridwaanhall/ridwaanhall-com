"use client";

import { useEffect, useState } from "react";

/**
 * The floating buttons that appear once the page has been scrolled.
 *
 * `backScroll.js` addressed four ids -- `scrollToTopBtn`, `backToBtn`,
 * `toGitHub`, `toDemo` -- but only the blog and project detail pages rendered
 * the last three. Reading `.classList` on the missing ones threw on every
 * scroll event, and because the throw aborted the handler, the button that
 * *did* exist never appeared either: a console full of errors and a
 * scroll-to-top that did nothing. Here each page composes the buttons it
 * actually has, so there is nothing to guard against.
 */
export function FloatingActions({ children }: { children?: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 300);
    onScroll();
    // `passive` because this only reads scrollY -- it never calls
    // preventDefault, and saying so lets the browser keep scrolling smooth.
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const state = scrolled ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10";

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
      {children}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`relative p-3 cursor-pointer rounded-full bg-zinc-800/90 hover:bg-zinc-700/90 backdrop-blur-sm transition-all duration-300 group ${state}`}
        aria-label="Scroll to top"
        // Out of the tab order until it is visible, so a keyboard reader does
        // not land on a control they cannot see.
        tabIndex={scrolled ? 0 : -1}
        title="Scroll to top"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="currentColor"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path d="M22.77 2.46 3.59 17.42A2 2 0 0 0 4.82 21H17.5v4a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4h12.68a2 2 0 0 0 1.23-3.58L25.23 2.46a2 2 0 0 0-2.46 0ZM17.5 31a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-4ZM17.5 41a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v3a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-3Z" />
        </svg>
      </button>
    </div>
  );
}
