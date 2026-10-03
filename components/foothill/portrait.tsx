"use client";

import Image from "next/image";
import { useRef } from "react";

import { gsap, MOTION_OK, useGSAP } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils/cn";

/** How many bands the drawing is uncovered in. Not the engraving's own line
 *  count -- each band uncovers a pair of them. */
const BANDS = 60;

/**
 * The owner's portrait: an engraving in horizontal lines, printed on a plate.
 *
 * It arrives the way a pen plotter would draw it -- band by band down the
 * plate, each band swept across in the opposite direction to the one before.
 * The sweep is a set of paper-coloured covers drawn over the image and pulled
 * away, so the image itself is an ordinary `next/image` that is complete and
 * correct before any script runs; the covers only ever exist while they are
 * animating.
 *
 * After that it drifts a little against the scroll, and tilts toward a fine
 * pointer. None of it happens under reduced motion.
 */
export function Portrait({
  src,
  alt,
  caption,
  className,
}: {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}) {
  const root = useRef<HTMLElement>(null);
  const plate = useRef<HTMLDivElement>(null);
  const covers = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const figure = root.current;
      const layer = covers.current;
      if (!figure || !layer || !plate.current) return;

      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.set(figure, { animation: "none", visibility: "visible" });

        const bands = Array.from({ length: BANDS }, (_, i) => {
          const band = document.createElement("div");
          band.className = "fh-print absolute inset-x-0";
          band.style.top = `${(i / BANDS) * 100}%`;
          band.style.height = `calc(${100 / BANDS}% + 1px)`;
          band.style.transformOrigin = i % 2 ? "0% 50%" : "100% 50%";
          layer.appendChild(band);
          return band;
        });

        gsap
          .timeline({ delay: 0.15, onComplete: () => bands.forEach((band) => band.remove()) })
          .from(plate.current, { clipPath: "inset(100% 0 0 0)", duration: 0.9, ease: "expo.inOut" })
          .to(bands, { scaleX: 0, duration: 0.55, ease: "power2.inOut", stagger: 0.028 }, "-=0.25")
          .from(figure.querySelector("figcaption"), { autoAlpha: 0, y: 8, duration: 0.6 }, "-=0.6");

        gsap.to(plate.current, {
          yPercent: -6,
          ease: "none",
          scrollTrigger: { trigger: figure, start: "top top", end: "bottom top", scrub: 0.6 },
        });

        return () => bands.forEach((band) => band.remove());
      });

      mm.add(`${MOTION_OK} and (pointer: fine)`, () => {
        const el = plate.current!;
        gsap.set(el, { transformPerspective: 900 });
        const toX = gsap.quickTo(el, "rotationY", { duration: 0.8, ease: "power3.out" });
        const toY = gsap.quickTo(el, "rotationX", { duration: 0.8, ease: "power3.out" });
        const onMove = (event: PointerEvent) => {
          const box = el.getBoundingClientRect();
          toX(((event.clientX - box.left) / box.width - 0.5) * 6);
          toY(-((event.clientY - box.top) / box.height - 0.5) * 6);
        };
        const onLeave = () => {
          toX(0);
          toY(0);
        };
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerleave", onLeave);
        return () => {
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerleave", onLeave);
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <figure ref={root} data-fh-hold className={cn("relative", className)}>
      <div ref={plate} className="fh-print relative aspect-square w-full overflow-hidden rounded-[18px]">
        <Image src={src} alt={alt} fill priority sizes="(min-width: 1024px) 520px, 90vw" className="object-cover" />
        <div ref={covers} aria-hidden="true" className="pointer-events-none absolute inset-0" />
      </div>
      {caption && <figcaption className="mt-3 text-[13px] text-mute">{caption}</figcaption>}
    </figure>
  );
}
