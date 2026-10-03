"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrambleTextPlugin);

/**
 * A short mono label that resolves out of noise the first time it is seen.
 *
 * Used for the markers above section headings -- a count, a period, a date --
 * which are the site's traces: the small facts that say what a section holds.
 * They read like a log line being written, which is the one motion on the site
 * that is about the subject rather than about the interface.
 *
 * Only a string, and only a short one: the text is replaced character by
 * character, so it must be the element's whole content. The server renders the
 * finished text, and that is what a reader without motion keeps.
 */
export function ScrambleIn({
  children,
  className,
  as: Component = "p",
}: {
  children: string;
  className?: string;
  as?: "p" | "span";
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !document.documentElement.classList.contains("motion")) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const text = el.textContent ?? "";
        ScrollTrigger.create({
          trigger: el,
          start: "top 94%",
          once: true,
          onEnter: () =>
            gsap.to(el, {
              duration: Math.min(1.9, 0.8 + text.length * 0.045),
              ease: "none",
              scrambleText: { text, chars: "01·:/_-", speed: 0.5, revealDelay: 0.15 },
            }),
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <Component ref={ref as React.Ref<never>} className={className}>
      {children}
    </Component>
  );
}
