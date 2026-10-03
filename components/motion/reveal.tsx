"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/**
 * Scroll-in motion for the public site, as two tiny client components.
 *
 * **Why components and not a page-wide scan.** The first version marked
 * elements with a data attribute and had one controller per page find and
 * animate them. GSAP animates by writing inline styles, and a page's
 * listings stream in behind `<Suspense>` -- so the controller wrote styles
 * onto elements React had not hydrated yet, and every page logged a
 * hydration mismatch. A component's layout effect runs only once its own
 * element is hydrated, so each of these touches exactly one element, at the
 * one moment that is safe.
 *
 * **Nothing is ever stuck invisible.** Before hydration the hidden state is
 * CSS (`html.motion [data-reveal]`), set only when the reader has not asked
 * for reduced motion, and backed by a three-second failsafe in
 * `styles/site.css`. `PageMotion` cancels the failsafe once the bundle runs.
 */

type Tag = "div" | "li" | "p" | "section" | "header" | "span" | "article" | "aside";

// Elements that cross into view in the same frame animate as one staggered
// group, so a row of six arrives as a ripple rather than all at once.
let queue: Element[] = [];
let frame = 0;

function flush() {
  frame = 0;
  const batch = queue;
  queue = [];
  gsap.to(batch, {
    opacity: 1,
    y: 0,
    duration: 1.25,
    ease: "power3.out",
    stagger: 0.1,
    overwrite: true,
  });
}

function enqueue(el: Element) {
  queue.push(el);
  if (!frame) frame = requestAnimationFrame(flush);
}

/** Rises 24px and fades in the first time it scrolls into view. */
export function Reveal({
  as: Component = "div",
  className,
  children,
  id,
}: {
  as?: Tag;
  className?: string;
  children?: React.ReactNode;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !document.documentElement.classList.contains("motion")) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(el, { opacity: 0, y: 28 });
        ScrollTrigger.create({ trigger: el, start: "top 94%", once: true, onEnter: () => enqueue(el) });
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(el, { opacity: 1, y: 0 });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <Component
      // A ref typed for the widest element is safe here: every tag in `Tag`
      // is an HTMLElement, and nothing reads more than that from it.
      ref={ref as React.Ref<never>}
      id={id}
      data-reveal=""
      className={className}
    >
      {children}
    </Component>
  );
}

/**
 * A heading whose lines rise out of their own masks.
 *
 * SplitText with `autoSplit`, so a resize or the web font arriving re-splits
 * on the new line breaks and the animation resumes where it was. It labels
 * the original element for assistive technology itself.
 */
export function SplitHeading({
  as: Component = "h1",
  className,
  children,
  delay = 0,
}: {
  as?: "h1" | "h2" | "p";
  className?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !document.documentElement.classList.contains("motion")) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(el, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          linesClass: "split-line",
          onSplit(self) {
            gsap.set(el, { visibility: "visible" });
            return gsap.from(self.lines, {
              yPercent: 110,
              duration: 1.45,
              ease: "expo.out",
              stagger: 0.12,
              delay,
            });
          },
        });
        return () => split.revert();
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(el, { visibility: "visible" });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <Component ref={ref} data-split="" className={className}>
      {children}
    </Component>
  );
}
