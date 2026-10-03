"use client";

import { useRef } from "react";

import { EASE, gsap, MOTION_OK, SplitText, useGSAP } from "@/lib/motion/gsap";
import { useMountedByHydration } from "@/lib/motion/use-hydrated-mount";

/**
 * The page's motion, declared by attribute and run from one place.
 *
 * Server components mark what moves and this does the moving, so no page has
 * to become a client component to animate:
 *
 *   data-fh-split    a heading whose lines rise out of a mask on arrival
 *   data-fh-enter    rises and fades in on arrival, in document order
 *   data-fh-hold     with either of the two above: animate on the first page
 *                    of the document too. The element arrives hidden from
 *                    CSS (`.fh-site [data-fh-hold]` in styles/site.css), so
 *                    there is no painted copy to flash; a CSS animation
 *                    reveals it anyway if this script never runs.
 *
 * Rendered once inside each page's `<main>`, and scoped to it. It touches
 * only the page's own heading block, which sits outside every `<Suspense>`
 * boundary: anything below the fold animates through `<Reveal>`, which waits
 * for its own content to hydrate.
 */
export function PageMotion() {
  const marker = useRef<HTMLSpanElement>(null);
  const fresh = useMountedByHydration();

  useGSAP(() => {
    const scope = marker.current?.closest("main");
    if (!scope) return;
    // On the server's own page only what was held back may enter; everything
    // else is already on screen.
    const arriving = (selector: string) =>
      Array.from(scope.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => !fresh || el.hasAttribute("data-fh-hold"),
      );

    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const held = scope.querySelectorAll<HTMLElement>("[data-fh-hold]");
      // Take over from the CSS fallback before animating anything held.
      if (held.length) gsap.set(held, { animation: "none", visibility: "visible" });

      arriving("[data-fh-split]").forEach((heading) => {
        SplitText.create(heading, {
          type: "lines",
          mask: "lines",
          linesClass: "fh-line",
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 105,
              duration: 0.9,
              ease: EASE,
              stagger: 0.08,
            }),
        });
      });

      const enter = arriving("[data-fh-enter]");
      if (enter.length) {
        gsap.from(enter, {
          y: 16,
          autoAlpha: 0,
          duration: 0.7,
          ease: EASE,
          stagger: 0.06,
          delay: 0.12,
          // Visibility stays inline: a held element's stylesheet hides it.
          clearProps: "transform,opacity",
        });
      }
    });

    return () => mm.revert();
  });

  return <span ref={marker} hidden />;
}
