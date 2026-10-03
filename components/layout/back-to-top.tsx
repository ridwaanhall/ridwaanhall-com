"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

import { ArrowFx } from "@/components/motion/interactive";
import { FOCUS } from "@/components/site/ui";
import { cn } from "@/lib/utils/cn";

gsap.registerPlugin(useGSAP);

/** How far down the page before the button is worth offering. */
const SHOW_AFTER = 160;

/**
 * The way back up: a ring in the corner that fills as the page is read.
 *
 * It replaced a "Back to top" link at the foot of the page, which was only
 * reachable by reaching the bottom -- the one place nobody needs it. This
 * appears after the first short scroll and its outline is the reading
 * progress: a sliver of an arc near the top of the page, a closed circle at
 * the end. The ring is the whole of its border, so there is nothing else to
 * draw; the fill is the canvas, which is what lets the arrow stay legible over
 * whatever scrolls beneath it.
 *
 * Bottom right rather than left: the left corner is where the framework's
 * development badge sits, and the toast stack is top right.
 *
 * Rendered by the shell outside `#page-content`, which animates a transform
 * and would otherwise become this fixed element's containing block. It is
 * hidden by its own markup until the script runs, so a reader without motion
 * -- or before the bundle -- never sees a button that cannot work yet; hidden
 * with `visibility`, so it is out of the tab order as well as out of sight.
 */
export function BackToTop() {
  const button = useRef<HTMLButtonElement>(null);
  const ring = useRef<SVGCircleElement>(null);

  useGSAP(() => {
    const el = button.current;
    const circle = ring.current;
    if (!el || !circle) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const length = circle.getTotalLength();
    gsap.set(circle, { strokeDasharray: length, strokeDashoffset: length });

    let shown = false;
    const apply = (progress: number, scroll: number) => {
      gsap.to(circle, {
        strokeDashoffset: length * (1 - progress),
        duration: reduce ? 0 : 0.35,
        ease: "power2.out",
        overwrite: true,
      });
      const show = scroll > SHOW_AFTER;
      if (show === shown) return;
      shown = show;
      gsap.to(el, {
        autoAlpha: show ? 1 : 0,
        y: show ? 0 : 14,
        scale: show ? 1 : 0.9,
        duration: reduce ? 0 : 0.7,
        ease: "expo.out",
        overwrite: "auto",
      });
    };

    /*
     * Measured from the document on every update rather than by a
     * ScrollTrigger. This element lives in the shell and mounts before the
     * page beneath it has streamed in, so a trigger's "max" was taken from a
     * page a screen tall: the ring read as full after the first short scroll.
     * The height is read live, and a resize of the body -- streamed sections,
     * late images -- re-measures it.
     */
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const scroll = window.scrollY;
      apply(max > 0 ? Math.min(1, Math.max(0, scroll / max)) : 0, scroll);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    update();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  });

  return (
    <button
      ref={button}
      type="button"
      aria-label="Back to top"
      title="Back to top"
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        })
      }
      style={{ opacity: 0, visibility: "hidden" }}
      className={cn(
        "fixed right-5 bottom-5 z-40 grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-black text-zinc-400 transition-colors duration-500 ease-out hover:text-zinc-100 sm:right-8 sm:bottom-8",
        FOCUS,
      )}
    >
      <svg viewBox="0 0 48 48" aria-hidden="true" className="absolute inset-0 h-full w-full -rotate-90">
        <circle ref={ring} cx="24" cy="24" r="23" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <ArrowFx direction="up" className="h-4 w-4" />
    </button>
  );
}
