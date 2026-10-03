"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

import { cn } from "@/lib/utils/cn";

gsap.registerPlugin(useGSAP);

/**
 * Hover and press motion for everything a reader can point at.
 *
 * Four pieces, one gesture each, so that every control on the site moves the
 * same way: a label rolls (`RollLabel`), a line draws (`LineText`), an arrow
 * travels (`ArrowFx`) and an image eases closer (`MediaHover`). Each is placed
 * *inside* the link or button it belongs to and listens to that element, its
 * host -- so the hit area is the whole control, not the few pixels of text.
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
  const down = () => gsap.to(host, { scale: 0.96, duration: 0.18, ease: "power2.out" });
  const up = () => gsap.to(host, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.5)" });
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
 * rolling in from below.
 *
 * The name comes from a visually hidden copy of the whole string; both rows of
 * split letters are `aria-hidden`. A row of per-letter boxes would otherwise
 * be read, and matched by role queries, as "C o n t a c t". Characters are
 * split at render rather than by SplitText, because the split is
 * deterministic and rendering it means nothing in the DOM changes shape after
 * hydration.
 *
 * `fill` adds the outlined button's hover: a surface that rises from the
 * bottom edge behind the label, and the host's text turning to the canvas
 * colour over it. Both belong to this gesture and neither is a `hover:` class:
 * a reader who has asked for reduced motion would get the dark text without
 * the light surface under it, which is dark on dark.
 *
 * `press` (on by default) is the host's give under the pointer.
 */
export function RollLabel({
  children,
  className,
  fill = false,
  press = true,
  leading,
}: {
  children: string;
  className?: string;
  fill?: boolean;
  press?: boolean;
  /** An icon before the label, painted above the fill. */
  leading?: React.ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const chars = Array.from(children);

  useHostMotion(ref, (host, el) => {
    const rows = el.querySelectorAll<HTMLElement>(":scope > .roll-row");
    const letters = [rows[0]?.children, rows[1]?.children].map((list) => Array.from(list ?? []));
    const tl = gsap
      .timeline({ paused: true, defaults: { duration: 0.55, ease: EASE, stagger: 0.014 } })
      .to(letters[0], { yPercent: -100 }, 0)
      .to(letters[1], { yPercent: -100 }, 0);

    const surface = fillRef.current;
    if (surface) gsap.set(surface, { scaleY: 0, transformOrigin: "50% 100%" });

    // The text turns as the surface passes the label's baseline, not at the
    // start: dark text over the still-empty lower half would vanish.
    let turn: gsap.core.Tween | null = null;
    const ink = (on: boolean) => {
      turn?.kill();
      turn = gsap.delayedCall(on ? 0.12 : 0.1, () => {
        host.style.color = on ? "var(--color-black)" : "";
      });
    };

    const enter = () => {
      tl.timeScale(1).play();
      if (!surface) return;
      gsap.to(surface, { scaleY: 1, transformOrigin: "50% 100%", duration: 0.5, ease: EASE, overwrite: true });
      ink(true);
    };
    const leave = () => {
      tl.timeScale(1.4).reverse();
      if (!surface) return;
      gsap.to(surface, { scaleY: 0, transformOrigin: "50% 0%", duration: 0.45, ease: EASE, overwrite: true });
      ink(false);
    };

    const stopHover = listen(host, enter, leave);
    const stopPress = press ? attachPress(host) : () => {};
    return () => {
      stopHover();
      stopPress();
      turn?.kill();
      host.style.color = "";
      tl.kill();
    };
  });

  return (
    <>
      {fill && <span ref={fillRef} aria-hidden="true" className="roll-fill" />}
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
 * right, rather than shrinking back the way it came.
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
        { backgroundSize: "100% 1px", duration: 0.6, ease: EASE, overwrite: true },
      );
    const leave = () =>
      gsap.to(el, {
        backgroundPosition: "100% 100%",
        backgroundSize: "0% 1px",
        duration: 0.45,
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
    gsap.set(back, { xPercent: -x, yPercent: -y });
    const tl = gsap
      .timeline({ paused: true, defaults: { duration: 0.5, ease: EASE } })
      .to(out, { xPercent: x, yPercent: y }, 0)
      .to(back, { xPercent: 0, yPercent: 0 }, 0.08);
    const stop = listen(
      host,
      () => tl.play(),
      () => tl.reverse(),
    );
    return () => {
      stop();
      tl.kill();
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
 * The icon inside an icon-only button: it lifts a little on hover with a
 * slight overshoot, and the button gives under the pointer like every other
 * control. Wrap the `<svg>` in it; it adds no box of its own.
 */
export function IconFx({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useHostMotion(ref, (host, el) => {
    const stop = listen(
      host,
      () => gsap.to(el, { y: -2, scale: 1.1, duration: 0.45, ease: "back.out(2.4)" }),
      () => gsap.to(el, { y: 0, scale: 1, duration: 0.5, ease: EASE }),
    );
    const stopPress = attachPress(host);
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
      () => gsap.to(target, { scale: 1.045, duration: 1.1, ease: EASE }),
      () => gsap.to(target, { scale: 1, duration: 0.9, ease: EASE }),
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
