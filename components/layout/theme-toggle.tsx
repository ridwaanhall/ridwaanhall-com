"use client";

import { useTheme } from "next-themes";
import { useCallback, useRef, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Light/dark theme toggle.
 *
 * Rendered twice -- the mobile navbar (below `md`) and the rail's `@username`
 * row (from `md` up) -- and **exactly one is on screen at any width**. Nothing
 * in CI catches a breakpoint band with none or two, so verify 375 / 767 / 768 /
 * 900 / 1023 / 1024 / 1440 after touching either placement.
 *
 * Which icon shows is decided by CSS from `html[data-theme]`, never by React.
 * That is load-bearing: the theme is applied before hydration, so a
 * state-driven icon would render the wrong one on the server and flash on
 * every page load. Both icons are always in the DOM and `globals.css` hides
 * one. The moon is the CSS default, so a reader with JS disabled (no
 * `data-theme` attribute at all, dark `:root` palette) still sees exactly one.
 *
 * The accessible name is deliberately static. The page is server-rendered and
 * cached while the theme lives in localStorage, so the server cannot know which
 * state to name; current state is exposed through `aria-pressed` instead, set
 * after mount.
 */
export function ThemeToggle({
  iconSize = "h-4 w-4",
  bare = false,
}: {
  iconSize?: string;
  /** Drop the padding and hover plate. Used inline beside text, where a hover
   *  chip would read as a second control. */
  bare?: boolean;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const ticket = useRef(0);
  // `false` on the server, `true` once hydrated -- without a setState in an
  // effect, which React 19 flags for triggering a cascading render. Used only
  // to decide whether `aria-pressed` can be stated truthfully yet.
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);

  const toggle = useCallback(() => {
    const next = resolvedTheme === "light" ? "dark" : "light";
    switchTheme(next, setTheme, ticket);
  }, [resolvedTheme, setTheme]);

  return (
    <button
      type="button"
      data-theme-toggle
      onClick={toggle}
      aria-label="Toggle light or dark theme"
      // Only meaningful once the client knows the theme; before that it would
      // be a guess baked into the prerendered HTML.
      aria-pressed={hydrated ? resolvedTheme === "light" : undefined}
      title="Toggle light or dark theme"
      className={cn(
        "group inline-flex cursor-pointer items-center justify-center rounded-md text-zinc-500 transition-colors hover:text-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400",
        !bare && "p-1.5 hover:bg-zinc-800",
      )}
    >
      <svg
        data-theme-icon="dark"
        className={cn(
          iconSize,
          "transition-transform duration-500 ease-out group-hover:-rotate-[18deg] group-hover:scale-110 group-active:scale-90",
        )}
        stroke="currentColor"
        fill="none"
        strokeWidth={2}
        viewBox="0 0 24 24"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
      <svg
        data-theme-icon="light"
        className={cn(
          iconSize,
          "transition-transform duration-500 ease-out group-hover:rotate-90 group-hover:scale-110 group-active:scale-90",
        )}
        stroke="currentColor"
        fill="none"
        strokeWidth={2}
        viewBox="0 0 24 24"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    </button>
  );
}

/** The hydration flag never changes after mount, so there is nothing to
 *  subscribe to. */
const subscribeNever = () => () => {};

const MODE_CLASSES = ["theme-switching", "theme-crossfade", "theme-fading"];
const FADE_MS = 320;

/**
 * Switch the theme as one movement.
 *
 * Flipping `data-theme` changes the computed colour of nearly every element at
 * once, and each then animates over whatever duration it declares -- `<body>`
 * is duration-200, `#page-content` is duration-700, 148 elements are
 * duration-300. Left alone the page changes in a visible cascade, sidebar
 * first and content column half a second later. The cause is the durations
 * *disagreeing*, not animation as such, so the fix makes everything move in
 * lockstep rather than suppressing motion.
 *
 * Three paths:
 *
 * - **View Transitions** (the normal path): the browser animates between two
 *   snapshots of the whole document, so per-element durations are out of the
 *   picture by construction. `.theme-crossfade` only *retimes* the UA's own
 *   crossfade, leaving its `plus-lighter` blending intact -- that is what stops
 *   the two snapshots dipping through grey at the halfway point.
 *   `.theme-switching` rides along so the live DOM under the snapshots is not
 *   animating too, or its cascade surfaces the instant the real page returns.
 * - **`.theme-fading`** (no View Transitions API): overrides
 *   `transition-property` as well as duration, forcing one shared 320ms colour
 *   transition. Overriding the property is the load-bearing half -- duration
 *   alone would leave `#page-content`'s `transition-all` animating layout too.
 * - **`prefers-reduced-motion`**: the instant swap.
 *
 * The monotonic ticket is not optional: a rapid second toggle skips the first
 * View Transition, and without it the older transition's cleanup would strip
 * the classes the newer one is using.
 *
 * The attribute is written here rather than left to next-themes because
 * next-themes applies it from an effect, which lands after `startViewTransition`
 * has already taken its "new" snapshot. Setting it inside the callback makes
 * the snapshot correct; the later effect writes the same value and is a no-op.
 *
 * One case is not covered: a theme change arriving from *another tab* is
 * applied by next-themes' own storage listener, so it swaps without the
 * crossfade. It still syncs correctly, and there is no hook to intercept it.
 */
function switchTheme(
  next: "light" | "dark",
  setTheme: (theme: string) => void,
  ticket: { current: number },
) {
  const root = document.documentElement;
  const id = ++ticket.current;

  const commit = () => {
    root.dataset.theme = next;
    setTheme(next);
  };

  const endMode = () => {
    if (id !== ticket.current) return;
    root.classList.remove(...MODE_CLASSES);
  };

  const beginMode = (...modes: string[]) => {
    root.classList.remove(...MODE_CLASSES);
    root.classList.add(...modes);
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    root.classList.add("theme-switching");
    commit();
    // Force the palette to commit while transitions are still suppressed,
    // which is what makes removing the class on the next line safe.
    void root.offsetHeight;
    root.classList.remove("theme-switching");
    return;
  }

  if (typeof document.startViewTransition === "function") {
    beginMode("theme-switching", "theme-crossfade");
    const transition = document.startViewTransition(commit);
    // A superseded transition rejects `finished`; either way the classes have
    // to come off.
    transition.finished.then(endMode, endMode);
    return;
  }

  // `.theme-fading` must be committed *before* the palette changes, or the
  // unified transition is not yet in effect when the colours move and nothing
  // animates at all.
  beginMode("theme-fading");
  void root.offsetHeight;
  commit();
  setTimeout(endMode, FADE_MS + 60);
}
