"use client";

import { useRef } from "react";

import { gsap, MOTION_OK, useGSAP } from "@/lib/motion/gsap";

/**
 * A sulfur hairline across the top that fills as the article is read.
 *
 * It measures the element named by `target`, not the page, so the comments
 * under a post do not count as reading it. Under reduced motion it still
 * tracks -- it is information, not decoration -- but without easing.
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
        scrollTrigger: {
          trigger: article,
          start: "top 20%",
          end: "bottom 80%",
          scrub: smooth ? 0.3 : true,
        },
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
