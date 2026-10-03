"use client";

import { useRef } from "react";

import { gsap, MOTION_OK, useGSAP } from "@/lib/motion/gsap";
import { useMountedByHydration } from "@/lib/motion/use-hydrated-mount";

/**
 * A whole number that counts up the first time it scrolls into view.
 *
 * The server renders the final figure, so the number is right before any
 * script runs and stays right under reduced motion; the count only replays a
 * figure that has not been seen yet.
 */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const byHydration = useMountedByHydration();
  const format = (n: number) => Math.round(n).toLocaleString("en-US");

  useGSAP(() => {
    const el = ref.current;
    if (!el || !value) return;
    if (byHydration && el.getBoundingClientRect().top < window.innerHeight) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const counter = { n: 0 };
      el.textContent = format(0);
      gsap.to(counter, {
        n: value,
        duration: 1.4,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = format(counter.n);
        },
        scrollTrigger: { trigger: el, start: "top 92%", once: true },
      });
      return () => {
        el.textContent = format(value);
      };
    });
    return () => mm.revert();
  });

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
