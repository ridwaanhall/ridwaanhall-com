"use client";

import { useRef } from "react";

import { EASE, gsap, MOTION_OK, useGSAP } from "@/lib/motion/gsap";
import { useMountedByHydration } from "@/lib/motion/use-hydrated-mount";

type Tag = "div" | "section" | "ul" | "ol" | "dl" | "p" | "li";

/**
 * A block that rises into place the first time it scrolls into view.
 *
 * A component of its own rather than an attribute a page-wide script looks
 * for, because a page-wide script runs before the `<Suspense>` boundaries
 * under it have hydrated -- and styling server markup React has not claimed
 * yet is a hydration mismatch. This animates only what it rendered, after it
 * has hydrated.
 *
 * With `stagger` its children rise one after another. Under reduced motion,
 * or for a block already on screen when the server's page was first painted,
 * it does nothing at all.
 */
export function Reveal({
  as: Component = "div",
  stagger = false,
  className,
  children,
  ...rest
}: {
  as?: Tag;
  stagger?: boolean;
  className?: string;
  children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">) {
  const ref = useRef<HTMLElement>(null);
  const byHydration = useMountedByHydration();

  useGSAP(() => {
    const block = ref.current;
    if (!block) return;
    if (byHydration && block.getBoundingClientRect().top < window.innerHeight) return;

    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.from(stagger ? Array.from(block.children) : block, {
        y: 22,
        autoAlpha: 0,
        duration: 0.8,
        ease: EASE,
        stagger: 0.05,
        clearProps: "transform,opacity,visibility",
        scrollTrigger: { trigger: block, start: "top 90%", once: true },
      });
    });
    return () => mm.revert();
  });

  return (
    // The tag is the caller's choice; the ref fits every one of them.
    <Component ref={ref as React.Ref<never>} className={className} {...rest}>
      {children}
    </Component>
  );
}
