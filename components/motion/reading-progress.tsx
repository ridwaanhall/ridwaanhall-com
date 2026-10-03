"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const subscribe = () => () => {};

/**
 * How far through an article the reader is, as a line across the top of the
 * window that grows with the scroll.
 *
 * Placed anywhere inside the `<article>` it measures. The line itself is
 * portalled to `document.body`: `#page-content` animates a transform, and a
 * transformed ancestor becomes the containing block for anything fixed inside
 * it, which would pin the line to the top of the article instead of the
 * window. Portalled content is created on the client, never hydrated, so GSAP
 * writing to it is safe from the first frame.
 *
 * It is information rather than decoration -- position in a long post -- so it
 * shows with reduced motion too; it simply follows the scroll without easing.
 */
export function ReadingProgress() {
  const anchor = useRef<HTMLSpanElement>(null);
  const [bar, setBar] = useState<HTMLDivElement | null>(null);
  const onClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  useGSAP(
    () => {
      const article = anchor.current?.closest("article");
      if (!article || !bar) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const tween = gsap.fromTo(
        bar,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: article,
            start: "top top",
            end: "bottom bottom",
            scrub: reduce ? true : 0.4,
          },
        },
      );
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { dependencies: [bar] },
  );

  return (
    <>
      <span ref={anchor} hidden />
      {onClient && createPortal(<div ref={setBar} aria-hidden="true" className="reading-progress" />, document.body)}
    </>
  );
}
