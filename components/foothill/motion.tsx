"use client";

import { useRef } from "react";

import { EASE, gsap, MOTION_OK, SplitText, useGSAP } from "@/lib/motion/gsap";
import { useMountedByHydration } from "@/lib/motion/use-hydrated-mount";
import { cn } from "@/lib/utils/cn";

/*
 * The site's motion, in one module.
 *
 * Server components mark what moves and these do the moving, so no page has to
 * become a client component to animate. Two rules hold for every one of them:
 *
 * - **Each animates only what it rendered, after it has hydrated.** A
 *   page-wide script runs before the `<Suspense>` boundaries under it have
 *   hydrated, and styling markup React has not claimed yet is a hydration
 *   mismatch. So motion is a component wrapped round its content, never a
 *   selector run from the top of the page.
 * - **Markup the server painted is not hidden and shown again.** On the
 *   document's first page, a block already on screen when it hydrates stays
 *   put -- unless it is marked `hold`, which hides it from CSS until the
 *   animation takes over (`[data-fh-hold]` in styles/site.css, with a fallback
 *   that reveals it anyway if no script ever runs).
 *
 * Everything is gated on `prefers-reduced-motion: no-preference`.
 */

/** Whether a block that just mounted may play its entrance. */
function mayEnter(el: Element, byHydration: boolean): boolean {
  if (el.hasAttribute("data-fh-hold")) return true;
  return !byHydration || el.getBoundingClientRect().top > window.innerHeight;
}

/**
 * Play an entrance the first time its element is on screen.
 *
 * An IntersectionObserver rather than a ScrollTrigger, for one reason: it
 * answers from where the element actually is when it starts watching. A
 * trigger computes its start position against the scroll offset of the
 * moment -- and on a client navigation that is still the previous page's
 * offset, so a block already on screen was judged "scrolled past" and never
 * entered: the projects index arrived blank until the reader scrolled.
 */
function onSeen(el: Element, play: () => void): () => void {
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      play();
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  observer.observe(el);
  return () => observer.disconnect();
}

/** Hand a held element from the CSS fallback to GSAP. */
function release(el: Element) {
  if (el.hasAttribute("data-fh-hold")) gsap.set(el, { animation: "none", visibility: "visible" });
}

/**
 * The page's heading block, declared by attribute.
 *
 *   data-fh-split    a heading whose lines rise out of a mask on arrival
 *   data-fh-enter    rises and fades in on arrival, in document order
 *   data-fh-hold     with either: animate on the document's first page too
 *
 * Rendered once inside each page's `<main>` and scoped to it. It touches only
 * the heading block, which sits outside every `<Suspense>` boundary.
 */
export function PageMotion() {
  const marker = useRef<HTMLSpanElement>(null);
  const fresh = useMountedByHydration();

  useGSAP(() => {
    const scope = marker.current?.closest("main");
    if (!scope) return;
    const arriving = (selector: string) =>
      Array.from(scope.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => !el.closest("[data-fh-scope]") && (!fresh || el.hasAttribute("data-fh-hold")),
      );

    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      scope.querySelectorAll("[data-fh-hold]").forEach((el) => {
        if (!el.closest("[data-fh-scope]")) release(el);
      });

      arriving("[data-fh-split]").forEach((heading) => {
        SplitText.create(heading, {
          type: "lines,words",
          mask: "lines",
          linesClass: "fh-line",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.words, {
              yPercent: 110,
              rotate: 4,
              duration: 1,
              ease: "expo.out",
              stagger: 0.035,
            }),
        });
      });

      const enter = arriving("[data-fh-enter]");
      if (enter.length) {
        gsap.from(enter, {
          y: 18,
          autoAlpha: 0,
          duration: 0.8,
          ease: EASE,
          stagger: 0.07,
          delay: 0.25,
          clearProps: "transform,opacity",
        });
      }
    });

    return () => mm.revert();
  });

  return <span ref={marker} hidden />;
}

type Tag = "div" | "section" | "ul" | "ol" | "dl" | "p" | "li" | "h2" | "h3" | "span" | "figure";

/**
 * A block that arrives the first time it scrolls into view.
 *
 * - default: the block rises and fades in
 * - `stagger`: its children arrive one after another
 * - `lines`: its text rises line by line out of a mask -- for headings and
 *   the few large statements, never for running text
 */
export function Reveal({
  as: Component = "div",
  stagger = false,
  lines = false,
  delay = 0,
  className,
  children,
  ...rest
}: {
  as?: Tag;
  stagger?: boolean;
  lines?: boolean;
  delay?: number;
  className?: string;
  children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">) {
  const ref = useRef<HTMLElement>(null);
  const byHydration = useMountedByHydration();

  useGSAP(() => {
    const block = ref.current;
    if (!block || !mayEnter(block, byHydration)) return;

    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      release(block);
      const split = lines
        ? SplitText.create(block, { type: "lines,words", mask: "lines", linesClass: "fh-line" })
        : null;
      const tween = split
        ? gsap.from(split.words, { yPercent: 110, rotate: 3, duration: 1, ease: "expo.out", stagger: 0.025, delay, paused: true })
        : gsap.from(stagger ? Array.from(block.children) : block, {
            y: 28,
            autoAlpha: 0,
            duration: 0.9,
            ease: EASE,
            stagger: 0.07,
            delay,
            paused: true,
            clearProps: "transform,opacity",
          });
      const stop = onSeen(block, () => tween.play());
      return () => {
        stop();
        split?.revert();
      };
    });
    return () => mm.revert();
  });

  return (
    <Component
      ref={ref as React.Ref<never>}
      data-fh-scope=""
      className={className}
      {...rest}
    >
      {children}
    </Component>
  );
}

/**
 * A label whose letters roll over on hover: each character slides up and its
 * copy rises from underneath, one after another.
 *
 * The copy is a text-shadow on the character rather than a second copy of the
 * text, so the label's text -- what a screen reader, a search and every
 * harness reads -- is exactly what was passed in. It listens on the nearest
 * link or button, so the whole control triggers it, not just the word.
 */
export function Roll({ children, className }: { children: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add(`${MOTION_OK} and (hover: hover)`, () => {
      const split = SplitText.create(el, { type: "chars", charsClass: "fh-roll-char" });
      const host = el.closest<HTMLElement>("a, button, summary, label") ?? el;
      // Inside a filled or outlined button the letters leave through the
      // button's own edge, not the label's: the copy waits a whole button
      // height below, and the button clips both.
      const look = getComputedStyle(host);
      const boxed = host !== el && (look.backgroundColor !== "rgba(0, 0, 0, 0)" || parseFloat(look.borderTopWidth) > 0);
      const gap = boxed ? host.getBoundingClientRect().height : 0;
      const overflow = host.style.overflow;
      if (boxed) {
        el.style.overflow = "visible";
        el.style.setProperty("--fh-roll-gap", `${gap}px`);
        host.style.overflow = "hidden";
      }
      const roll = gsap
        .timeline({ paused: true })
        .to(split.chars, { ...(boxed ? { y: -gap } : { yPercent: -100 }), duration: 0.5, ease: "power3.inOut", stagger: 0.016 });
      const play = () => roll.play();
      const back = () => roll.reverse();
      host.addEventListener("pointerenter", play);
      host.addEventListener("pointerleave", back);
      host.addEventListener("focusin", play);
      host.addEventListener("focusout", back);
      return () => {
        host.removeEventListener("pointerenter", play);
        host.removeEventListener("pointerleave", back);
        host.removeEventListener("focusin", play);
        host.removeEventListener("focusout", back);
        host.style.overflow = overflow;
        split.revert();
      };
    });
    return () => mm.revert();
  }, { dependencies: [children], revertOnUpdate: true });

  // Keyed on the text: SplitText replaces the span's text node with its own
  // markup, so a label that changes ("Send" to "Sending…") must be a new span
  // for React to write into, not the node SplitText took away.
  return (
    <span key={children} ref={ref} className={cn("fh-roll", className)}>
      {children}
    </span>
  );
}

/**
 * A number that counts up the first time it scrolls into view.
 *
 * The server renders the final figure, so it is right before any script runs
 * and stays right under reduced motion.
 */
export function CountUp({
  value,
  decimals = 0,
  className,
}: {
  value: number;
  decimals?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const byHydration = useMountedByHydration();
  const format = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  useGSAP(() => {
    const el = ref.current;
    if (!el || !value) return;
    // A figure the server painted on screen still counts: the number is the
    // same at both ends, so there is nothing to flash, only to replay.
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const counter = { n: 0 };
      const onScreen = byHydration && el.getBoundingClientRect().top < window.innerHeight;
      const tween = gsap.to(counter, {
        n: value,
        duration: 1.6,
        ease: "power3.out",
        delay: onScreen ? 0.2 : 0,
        paused: true,
        onStart: () => {
          el.textContent = format(0);
        },
        onUpdate: () => {
          el.textContent = format(counter.n);
        },
      });
      const stop = onSeen(el, () => tween.play());
      return () => {
        stop();
        el.textContent = format(value);
      };
    });
    return () => mm.revert();
  });

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {format(value)}
    </span>
  );
}

/**
 * The entrance for a chart, or anything else drawn from many small marks.
 *
 * It looks inside itself for what to move, by attribute, so the chart stays a
 * server component that only labels its parts:
 *
 *   data-fh-bar    grows from its left edge
 *   data-fh-col    grows from its baseline
 *   data-fh-sweep  uncovered left to right behind a soft edge -- one tween
 *                  for a whole grid, where a tween per cell (a year is 371)
 *                  is what made the dashboard stutter
 *   data-fh-draw   an SVG stroke that draws itself
 *   data-fh-fade   fades in once the strokes are under way
 */
export function Animate({
  as: Component = "div",
  className,
  children,
  ...rest
}: {
  as?: Tag;
  className?: string;
  children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">) {
  const ref = useRef<HTMLElement>(null);
  const byHydration = useMountedByHydration();

  useGSAP(() => {
    const scope = ref.current;
    if (!scope || !mayEnter(scope, byHydration)) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      release(scope);
      const q = <T extends Element>(selector: string) => Array.from(scope.querySelectorAll<T>(selector));
      const tl = gsap.timeline({ defaults: { ease: EASE }, paused: true });
      tl.from(scope, { autoAlpha: 0, y: 16, duration: 0.6, clearProps: "transform,opacity" });
      const bars = q("[data-fh-bar]");
      if (bars.length)
        tl.from(bars, { scaleX: 0, transformOrigin: "0% 50%", duration: 1.1, ease: "expo.out", stagger: 0.04 }, 0.1);
      const cols = q("[data-fh-col]");
      if (cols.length)
        tl.from(cols, { scaleY: 0, transformOrigin: "50% 100%", duration: 0.9, ease: "expo.out", stagger: 0.03 }, 0.1);
      const sweeps = q("[data-fh-sweep]");
      if (sweeps.length)
        tl.fromTo(
          sweeps,
          { "--fh-sweep": "-20%" },
          { "--fh-sweep": "120%", duration: 1.8, ease: "power2.inOut", clearProps: "--fh-sweep" },
          0.1,
        );
      const strokes = q<SVGGeometryElement>("[data-fh-draw]");
      strokes.forEach((path) => {
        // A path drawn with `pathLength` is measured in those units, which is
        // the only measure that survives `vector-effect: non-scaling-stroke`.
        const length = Number(path.getAttribute("pathLength")) || path.getTotalLength?.() || 0;
        if (!length) return;
        tl.fromTo(
          path,
          { strokeDasharray: length, strokeDashoffset: length },
          { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut", clearProps: "strokeDasharray,strokeDashoffset" },
          0.15,
        );
      });
      const fades = q("[data-fh-fade]");
      if (fades.length) tl.from(fades, { autoAlpha: 0, duration: 1.2, ease: "power1.out" }, 0.6);
      return onSeen(scope, () => tl.play());
    });
    return () => mm.revert();
  });

  return (
    <Component
      ref={ref as React.Ref<never>}
      data-fh-scope=""
      className={className}
      {...rest}
    >
      {children}
    </Component>
  );
}

/**
 * A sulfur hairline across the top that fills as an article is read.
 *
 * It measures the element named by `target`, not the page, so the comments
 * under a post do not count as reading it. Under reduced motion it still
 * tracks -- it is information, not decoration -- just without easing.
 */
export function ReadingProgress({ target }: { target: string }) {
  const bar = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const article = document.querySelector(target);
    if (!article || !bar.current) return;
    const smooth = window.matchMedia(MOTION_OK).matches;
    gsap.fromTo(
      bar.current,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { trigger: article, start: "top 20%", end: "bottom 80%", scrub: smooth ? 0.3 : true },
      },
    );
  });

  return (
    <div
      ref={bar}
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[55] h-[2px] origin-left scale-x-0 bg-sulfur-mark"
    />
  );
}

