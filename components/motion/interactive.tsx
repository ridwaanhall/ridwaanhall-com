"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { useRef } from "react";

import { cn } from "@/lib/utils/cn";

gsap.registerPlugin(useGSAP, ScrambleTextPlugin);

/**
 * Hover and press motion for everything a reader can point at.
 *
 * **A gesture per job, not one gesture everywhere.** The same roll on every
 * link made the site feel like one trick repeated, and it said nothing about
 * what the link does. So each kind of target moves the way its function
 * suggests:
 *
 * - `RollLabel` -- letters roll over. Places you go: the navbar, filled
 *   buttons, page numbers.
 * - `LineText` -- an underline draws in and leaves the other way. Things you
 *   read: post titles, inline links, credentials.
 * - `NudgeText` -- a short rule grows in front and the words step aside. A
 *   list you pick from: the footer, the About index, legal links.
 * - `SpreadText` -- the letters open out. A project's name, which is a thing
 *   to look at rather than to read.
 * - `ScrambleHover` -- mono text re-resolves out of noise. Traces that are
 *   links, like an address.
 * - `ArrowFx`, `IconFx`, `MediaHover` -- the arrow travels, the icon lifts,
 *   the picture eases closer.
 * - `HoverDim` -- the rest of a list steps back while one item is pointed at.
 *
 * Outlined buttons take **none** of these: their hover is a change of fill
 * colour, a CSS transition on the button itself, so the control reads as a
 * surface being lit rather than as text doing something.
 *
 * Each piece is placed *inside* the link or button it belongs to and listens
 * to that element, its host -- so the hit area is the whole control.
 *
 * **Each touches only what it renders.** GSAP animates by writing inline
 * styles, and a style written onto an element React has not hydrated yet is a
 * hydration mismatch. A component's effect runs after its own subtree has
 * hydrated, so every tween here targets the component's own spans. The one
 * exception is the press, which scales the host; the host is an ancestor, and
 * an ancestor has always hydrated before its descendant's effect runs.
 *
 * **Only where it means something.** A fine pointer that hovers, and a reader
 * who has not asked for reduced motion. Everywhere else these render exactly
 * the static markup, which is already the finished state.
 */

const HOVER = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";
const HOST = "a, button, summary, label, [data-motion-host]";

/** One ease for every hover on the site, so nothing feels borrowed. */
const EASE = "expo.out";

/**
 * Every duration in one place. Unhurried on purpose: a hover that finishes
 * before the eye has landed on it reads as a flicker, not a response. Leaving
 * is a little quicker than arriving, so the page never lags behind the pointer.
 */
const T = {
  roll: 0.85,
  rollStagger: 0.022,
  lineIn: 0.95,
  lineOut: 0.65,
  arrow: 0.8,
  icon: 0.75,
  media: 1.5,
  nudge: 0.75,
  spread: 0.9,
  scramble: 0.9,
  dim: 0.6,
  pressDown: 0.22,
  pressUp: 0.8,
} as const;

function hostOf(el: HTMLElement): HTMLElement {
  return el.closest<HTMLElement>(HOST) ?? el;
}

/**
 * Runs `setup` with the host once hover motion applies, and undoes it when the
 * media query stops matching or the component unmounts.
 */
function useHostMotion(
  ref: React.RefObject<HTMLElement | null>,
  setup: (host: HTMLElement, el: HTMLElement) => (() => void) | void,
) {
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(HOVER, () => setup(hostOf(el), el));
      return () => mm.revert();
    },
    { scope: ref },
  );
}

function listen(host: HTMLElement, enter: () => void, leave: () => void) {
  host.addEventListener("pointerenter", enter);
  host.addEventListener("pointerleave", leave);
  return () => {
    host.removeEventListener("pointerenter", enter);
    host.removeEventListener("pointerleave", leave);
  };
}

/**
 * Press feedback: the host gives slightly under the pointer and springs back.
 * Registered once per host, however many motion pieces live inside it.
 */
function attachPress(host: HTMLElement) {
  if (host.dataset.pressBound) return () => {};
  host.dataset.pressBound = "true";
  const down = () => gsap.to(host, { scale: 0.96, duration: T.pressDown, ease: "power2.out" });
  const up = () => gsap.to(host, { scale: 1, duration: T.pressUp, ease: "elastic.out(1, 0.5)" });
  host.addEventListener("pointerdown", down);
  host.addEventListener("pointerup", up);
  host.addEventListener("pointerleave", up);
  return () => {
    delete host.dataset.pressBound;
    host.removeEventListener("pointerdown", down);
    host.removeEventListener("pointerup", up);
    host.removeEventListener("pointerleave", up);
    gsap.set(host, { clearProps: "transform" });
  };
}

/**
 * A label whose letters roll up on hover and are replaced by a second copy
 * rolling in from below -- the gesture for a place you go.
 *
 * The name comes from a visually hidden copy of the whole string; both rows of
 * split letters are `aria-hidden`. A row of per-letter boxes would otherwise
 * be read, and matched by role queries, as "C o n t a c t". Characters are
 * split at render rather than by SplitText, because the split is
 * deterministic and rendering it means nothing in the DOM changes shape after
 * hydration.
 *
 * `press` (on by default) is the host's give under the pointer.
 */
export function RollLabel({
  children,
  className,
  press = true,
  leading,
}: {
  children: string;
  className?: string;
  press?: boolean;
  /** An icon before the label. */
  leading?: React.ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const chars = Array.from(children);

  useHostMotion(ref, (host, el) => {
    const rows = el.querySelectorAll<HTMLElement>(":scope > .roll-row");
    const letters = [rows[0]?.children, rows[1]?.children].map((list) => Array.from(list ?? []));
    const tl = gsap
      .timeline({ paused: true, defaults: { duration: T.roll, ease: EASE, stagger: T.rollStagger } })
      .to(letters[0], { yPercent: -100 }, 0)
      .to(letters[1], { yPercent: -100 }, 0);

    const stopHover = listen(
      host,
      () => tl.timeScale(1).play(),
      () => tl.timeScale(1.3).reverse(),
    );
    const stopPress = press ? attachPress(host) : () => {};
    return () => {
      stopHover();
      stopPress();
      tl.kill();
    };
  });

  return (
    <>
      {leading && <span className="relative inline-flex">{leading}</span>}
      <span ref={ref} className={cn("roll", className)}>
        <span className="sr-only">{children}</span>
        <span className="roll-row" aria-hidden="true">
          {chars.map((char, index) => (
            <span key={index} className="roll-char">
              {char}
            </span>
          ))}
        </span>
        <span className="roll-row roll-under" aria-hidden="true">
          {chars.map((char, index) => (
            <span key={index} className="roll-char">
              {char}
            </span>
          ))}
        </span>
      </span>
    </>
  );
}

/**
 * Text whose underline draws in from the left on hover and leaves to the
 * right, rather than shrinking back the way it came -- the gesture for
 * something you read.
 *
 * The line is a background stroke on the text itself, not a positioned rule,
 * so a title that wraps onto three lines is underlined on all three.
 */
export function LineText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useHostMotion(ref, (host, el) => {
    const enter = () =>
      gsap.fromTo(
        el,
        { backgroundPosition: "0% 100%", backgroundSize: "0% 1px" },
        { backgroundSize: "100% 1px", duration: T.lineIn, ease: EASE, overwrite: true },
      );
    const leave = () =>
      gsap.to(el, {
        backgroundPosition: "100% 100%",
        backgroundSize: "0% 1px",
        duration: T.lineOut,
        ease: EASE,
        overwrite: true,
      });
    const stop = listen(host, enter, leave);
    return () => {
      stop();
      gsap.set(el, { clearProps: "backgroundPosition,backgroundSize" });
    };
  });

  return (
    <span ref={ref} className={cn("line-text", className)}>
      {children}
    </span>
  );
}

/**
 * A short rule that grows in front of the words while they step aside -- the
 * gesture for picking one entry from a list, like a finger running down an
 * index.
 *
 * The rule starts at zero width, so at rest the text sits exactly where an
 * unadorned link would; nothing reserves room for the hover.
 */
export function NudgeText({ children, className }: { children: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useHostMotion(ref, (host, el) => {
    const [rule, words] = Array.from(el.children) as HTMLElement[];
    const tl = gsap
      .timeline({ paused: true, defaults: { duration: T.nudge, ease: EASE } })
      .to(rule, { width: "0.75rem", marginRight: "0.4rem" }, 0)
      .to(words, { x: 2 }, 0);
    const stop = listen(
      host,
      () => tl.timeScale(1).play(),
      () => tl.timeScale(1.25).reverse(),
    );
    return () => {
      stop();
      tl.kill();
      gsap.set([rule, words], { clearProps: "all" });
    };
  });

  return (
    <span ref={ref} className={cn("nudge", className)}>
      <span aria-hidden="true" className="nudge-rule" />
      <span className="inline-block">{children}</span>
    </span>
  );
}

/**
 * Letters that open out on hover -- the gesture for a name you look at, set
 * apart from titles you read, which draw a line instead.
 */
export function SpreadText({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useHostMotion(ref, (host, el) => {
    const stop = listen(
      host,
      () => gsap.to(el, { letterSpacing: "0.02em", duration: T.spread, ease: EASE, overwrite: true }),
      () => gsap.to(el, { letterSpacing: "0em", duration: T.spread * 0.8, ease: EASE, overwrite: true }),
    );
    return () => {
      stop();
      gsap.set(el, { clearProps: "letterSpacing" });
    };
  });

  return (
    <span ref={ref} className={className}>
      {children}
    </span>
  );
}

/**
 * Mono text that re-resolves out of noise when pointed at -- the gesture for a
 * trace that is also a link, echoing the section markers that arrive the same
 * way. Strings only: the text is rewritten in place.
 */
export function ScrambleHover({ children, className }: { children: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useHostMotion(ref, (host, el) => {
    const stop = listen(
      host,
      () =>
        gsap.to(el, {
          duration: T.scramble,
          ease: "none",
          overwrite: true,
          scrambleText: { text: children, chars: "01·:/_-", speed: 0.6, revealDelay: 0.1 },
        }),
      () => {},
    );
    return () => {
      stop();
      el.textContent = children;
    };
  });

  return (
    <span ref={ref} className={className}>
      {children}
    </span>
  );
}

type Direction = "right" | "left" | "up" | "up-right" | "down";

const TRAVEL: Record<Direction, { x: number; y: number }> = {
  right: { x: 110, y: 0 },
  left: { x: -110, y: 0 },
  up: { x: 0, y: -110 },
  "up-right": { x: 110, y: -110 },
  down: { x: 0, y: 110 },
};

const PATHS: Record<Direction, string> = {
  right: "M5 12h14M13 6l6 6-6 6",
  left: "M19 12H5M11 6l-6 6 6 6",
  up: "M12 19V5M6 11l6-6 6 6",
  "up-right": "M7 17 17 7M8 7h9v9",
  down: "M12 5v14M6 13l6 6 6-6",
};

/**
 * An arrow that leaves in the direction it points and comes back from the
 * other side -- the gesture of following a link, rather than a nudge.
 */
export function ArrowFx({ direction = "right", className }: { direction?: Direction; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useHostMotion(ref, (host, el) => {
    const [out, back] = Array.from(el.children) as HTMLElement[];
    const { x, y } = TRAVEL[direction];
    // The waiting copy is parked off-stage by CSS, and GSAP reads an existing
    // transform into its pixel `x`/`y`. Left there, that offset survives the
    // tween below -- which only moves the percentages -- and the arrow never
    // comes back into view. Zero the pixels and park it in percentages alone.
    gsap.set(back, { x: 0, y: 0, xPercent: -x, yPercent: -y });
    const tl = gsap
      .timeline({ paused: true, defaults: { duration: T.arrow, ease: EASE } })
      .to(out, { xPercent: x, yPercent: y }, 0)
      .to(back, { xPercent: 0, yPercent: 0 }, 0.1);
    const stop = listen(
      host,
      () => tl.timeScale(1).play(),
      () => tl.timeScale(1.3).reverse(),
    );
    return () => {
      stop();
      tl.kill();
      gsap.set([out, back], { clearProps: "transform" });
    };
  });

  const icon = (hidden: boolean) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("h-full w-full", hidden && "arrow-fx-back")}
    >
      <path d={PATHS[direction]} />
    </svg>
  );

  return (
    <span ref={ref} aria-hidden="true" className={cn("arrow-fx", className)}>
      {icon(false)}
      {icon(true)}
    </span>
  );
}

/**
 * The icon inside an icon-only button or beside a link: it lifts a little on
 * hover with a slight overshoot, and the host gives under the pointer. Wrap
 * the `<svg>` in it; it adds no box of its own.
 *
 * `press` is off for icons beside a link's text, where the link as a whole is
 * the control and a squeeze would read as the text jumping.
 */
export function IconFx({
  children,
  className,
  press = true,
}: {
  children: React.ReactNode;
  className?: string;
  press?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useHostMotion(ref, (host, el) => {
    const stop = listen(
      host,
      () => gsap.to(el, { y: -2, scale: 1.12, rotate: -6, duration: T.icon, ease: "back.out(2.2)" }),
      () => gsap.to(el, { y: 0, scale: 1, rotate: 0, duration: T.icon, ease: EASE }),
    );
    const stopPress = press ? attachPress(host) : () => {};
    return () => {
      stop();
      stopPress();
      gsap.set(el, { clearProps: "transform" });
    };
  });

  return (
    <span ref={ref} className={cn("inline-flex", className)}>
      {children}
    </span>
  );
}

/**
 * The frame around an image in a link: on hover the picture eases slightly
 * closer inside a frame that does not move.
 */
export function MediaHover({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useHostMotion(ref, (host) => {
    const target = inner.current;
    if (!target) return;
    const stop = listen(
      host,
      () => gsap.to(target, { scale: 1.045, duration: T.media, ease: EASE }),
      () => gsap.to(target, { scale: 1, duration: T.media * 0.8, ease: EASE }),
    );
    return () => {
      stop();
      gsap.set(target, { clearProps: "transform" });
    };
  });

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <div ref={inner} className="absolute inset-0">
        {children}
      </div>
    </div>
  );
}

/**
 * A list whose other items step back while one is pointed at.
 *
 * For lists read by scanning -- the posts, the places to reach out -- where
 * the question is "this one?", and dimming the rest answers it. Items are the
 * descendants carrying `data-dim-item`; the wrapper is the one element this
 * component renders, and it animates only those items, which are hydrated by
 * the time a pointer can reach them.
 */
export function HoverDim({
  children,
  className,
  as: Component = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "ul";
}) {
  const ref = useRef<HTMLElement>(null);

  useHostMotion(ref, (_host, root) => {
    const items = () => Array.from(root.querySelectorAll<HTMLElement>("[data-dim-item]"));
    let current: HTMLElement | null = null;
    const over = (event: PointerEvent) => {
      const item = (event.target as Element).closest<HTMLElement>("[data-dim-item]");
      if (!item || item === current) return;
      current = item;
      const all = items();
      gsap.to(all.filter((other) => other !== item), { opacity: 0.4, duration: T.dim, ease: EASE, overwrite: true });
      gsap.to(item, { opacity: 1, duration: T.dim, ease: EASE, overwrite: true });
    };
    const leave = () => {
      current = null;
      gsap.to(items(), { opacity: 1, duration: T.dim, ease: EASE, overwrite: true });
    };
    root.addEventListener("pointerover", over);
    root.addEventListener("pointerleave", leave);
    return () => {
      root.removeEventListener("pointerover", over);
      root.removeEventListener("pointerleave", leave);
      gsap.set(items(), { clearProps: "opacity" });
    };
  });

  return (
    <Component ref={ref as React.Ref<never>} data-motion-host="" className={className}>
      {children}
    </Component>
  );
}
