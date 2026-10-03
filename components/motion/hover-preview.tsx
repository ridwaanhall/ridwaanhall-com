"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

gsap.registerPlugin(useGSAP);

/**
 * A list whose rows show their image beside the pointer.
 *
 * Rows stay server-rendered and plain: any descendant carrying
 * `data-preview="<image url>"` is picked up by delegation, so the list itself
 * needs no client code per row and rows that stream in later work too.
 *
 * Only where it can mean something -- a fine pointer that hovers, and a reader
 * who has not asked for reduced motion. Everywhere else the list is just a
 * list, and the image is on the page the row links to.
 *
 * The box follows with `quickTo`, which retargets one tween instead of
 * creating one per `pointermove`, and leans slightly into the direction of
 * travel so it reads as carried rather than pinned.
 */
export function HoverPreviewList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);

  useGSAP(
    () => {
      const list = root.current;
      const frame = box.current;
      const img = image.current;
      if (!list || !frame || !img) return;

      const mm = gsap.matchMedia();
      mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const xTo = gsap.quickTo(frame, "x", { duration: 0.8, ease: "power3.out" });
        const yTo = gsap.quickTo(frame, "y", { duration: 0.8, ease: "power3.out" });
        const tilt = gsap.quickTo(frame, "rotation", { duration: 0.6, ease: "power3.out" });
        let lastX = 0;
        let current = "";

        const hide = () => {
          current = "";
          gsap.to(frame, { autoAlpha: 0, scale: 0.92, duration: 0.4, ease: "power2.out" });
        };

        const onMove = (event: PointerEvent) => {
          xTo(event.clientX + 28);
          yTo(event.clientY - frame.offsetHeight / 2);
          tilt(gsap.utils.clamp(-6, 6, (event.clientX - lastX) * 0.4));
          lastX = event.clientX;
        };

        const onOver = (event: PointerEvent) => {
          const row = (event.target as Element).closest<HTMLElement>("[data-preview]");
          const src = row?.dataset.preview;
          if (!src) return hide();
          if (src === current) return;
          if (!current) {
            // Arriving from outside: start under the pointer, not wherever the
            // box was last left.
            gsap.set(frame, { x: event.clientX + 28, y: event.clientY - frame.offsetHeight / 2 });
          }
          current = src;
          img.src = src;
          gsap.to(frame, { autoAlpha: 1, scale: 1, duration: 0.55, ease: "power3.out" });
        };

        gsap.set(frame, { scale: 0.92 });
        list.addEventListener("pointermove", onMove);
        list.addEventListener("pointerover", onOver);
        list.addEventListener("pointerleave", hide);
        return () => {
          list.removeEventListener("pointermove", onMove);
          list.removeEventListener("pointerover", onOver);
          list.removeEventListener("pointerleave", hide);
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className={className}>
      {children}
      <div ref={box} className="hover-preview" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element --
            the src is already an optimised `/_next/image` URL, chosen per row
            on the server with `getImageProps`; this element only swaps it. */}
        <img ref={image} alt="" decoding="async" />
      </div>
    </div>
  );
}
