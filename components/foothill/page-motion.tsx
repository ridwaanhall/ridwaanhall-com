"use client";

import { useRef } from "react";

import { EASE, gsap, MOTION_OK, SplitText, useGSAP } from "@/lib/motion/gsap";

/**
 * Whether this is the first page the document has shown.
 *
 * Module state rather than component state, because it is a fact about the
 * document: the server's HTML for the first page has already been painted
 * when this mounts, so animating it *from* hidden would show it, hide it and
 * show it again. Every later page arrives by client navigation, mounts before
 * its first paint, and can enter from nothing without a flash.
 */
let documentFresh = true;

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
 *   data-fh-reveal   rises in once, the first time it scrolls into view;
 *                    with data-fh-stagger its children do, one after another
 *
 * Rendered once inside each page's `<main>`, and scoped to it.
 */
export function PageMotion() {
  const marker = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const scope = marker.current?.closest("main");
    if (!scope) return;
    const fresh = documentFresh;
    documentFresh = false;

    // On a fresh document only what was held back may enter; everything else
    // is already on screen.
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

      scope.querySelectorAll<HTMLElement>("[data-fh-reveal]").forEach((block) => {
        // Already on screen on a fresh document: it has been seen, leave it.
        if (fresh && block.getBoundingClientRect().top < window.innerHeight) return;
        const targets = block.hasAttribute("data-fh-stagger") ? Array.from(block.children) : [block];
        gsap.from(targets, {
          y: 22,
          autoAlpha: 0,
          duration: 0.8,
          ease: EASE,
          stagger: 0.05,
          clearProps: "transform,opacity,visibility",
          scrollTrigger: { trigger: block, start: "top 90%", once: true },
        });
      });
    });

    return () => mm.revert();
  });

  return <span ref={marker} hidden />;
}
