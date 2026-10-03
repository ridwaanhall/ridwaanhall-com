"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/foothill/icons";
import { EASE, gsap, MOTION_OK } from "@/lib/motion/gsap";

const R = 21;
const LENGTH = 2 * Math.PI * R;

/**
 * Back to the top, with how far down the page you are drawn around it.
 *
 * The ring is the page's scroll progress: it starts as a sliver and closes
 * into a full circle exactly at the bottom, so the button doubles as the
 * answer to "how much more is there". It appears once the reader is a screen
 * down and leaves again near the top, where it would point at where they
 * already are.
 *
 * The ring is drawn from scroll position on every frame it changes, not
 * animated, so it is information under reduced motion too; only the button's
 * arrival and the scroll itself lose their easing there.
 */
export function ScrollTop() {
  const button = useRef<HTMLButtonElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      ring.current?.setAttribute("stroke-dashoffset", String(LENGTH * (1 - progress)));
      button.current?.toggleAttribute("data-complete", progress > 0.995);
      setVisible(window.scrollY > window.innerHeight * 0.8);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  useEffect(() => {
    const el = button.current;
    if (!el) return;
    const motion = window.matchMedia(MOTION_OK).matches;
    gsap.to(el, {
      autoAlpha: visible ? 1 : 0,
      scale: visible ? 1 : 0.6,
      y: visible ? 0 : 16,
      duration: motion ? 0.5 : 0,
      ease: visible ? "back.out(1.8)" : EASE,
    });
  }, [visible]);

  const toTop = () => {
    const motion = window.matchMedia(MOTION_OK).matches;
    window.scrollTo({ top: 0, behavior: motion ? "smooth" : "auto" });
    document.getElementById("page-content")?.focus({ preventScroll: true });
  };

  return (
    <button
      ref={button}
      type="button"
      onClick={toTop}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      className="group fixed right-4 bottom-4 z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-paper/85 text-ink opacity-0 backdrop-blur-md invisible md:right-8 md:bottom-8"
    >
      <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="24" cy="24" r={R} fill="none" stroke="var(--fh-line)" strokeWidth="1.5" />
        <circle
          ref={ring}
          className="fh-ring"
          cx="24"
          cy="24"
          r={R}
          fill="none"
          stroke="var(--fh-sulfur-mark)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={LENGTH}
          strokeDashoffset={LENGTH}
        />
      </svg>
      <span className="relative h-[18px] w-[18px] overflow-hidden">
        <Icon
          name="arrow-up"
          className="absolute inset-0 h-[18px] w-[18px] transition-transform duration-500 ease-[cubic-bezier(.7,0,.2,1)] group-hover:-translate-y-full"
        />
        <Icon
          name="arrow-up"
          className="absolute inset-0 h-[18px] w-[18px] translate-y-full transition-transform duration-500 ease-[cubic-bezier(.7,0,.2,1)] group-hover:translate-y-0"
        />
      </span>
    </button>
  );
}
