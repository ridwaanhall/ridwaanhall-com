"use client";

import { useRef, useState } from "react";

import type { Contour, Summit } from "@/components/foothill/contours";
import { VIEW } from "@/components/foothill/contours";
import { EASE, gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";

const formatMetres = (m: number) => `${m.toLocaleString("en-US")} m`;

/**
 * The hero's map: the contours drawing themselves in, one line lit.
 *
 * Which line is lit follows the reader down the page. At the top it is the
 * highest contour and, as the hero scrolls away, it steps down the mountain to
 * the foothills -- the elevation readout beside it says which. That is the
 * one piece of play on the site, and it is tied to the place rather than to
 * an effect.
 */
export function ContourField({ lines, summits }: { lines: Contour[]; summits: Summit[] }) {
  const root = useRef<HTMLDivElement>(null);
  const plane = useRef<SVGGElement>(null);
  // Highest contour first: the line lit before anybody scrolls.
  const order = [...lines.keys()].sort((a, b) => lines[b].metres - lines[a].metres);
  const [lit, setLit] = useState(order[0] ?? 0);

  useGSAP(
    () => {
      const paths = gsap.utils.toArray<SVGPathElement>("path", root.current);
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        // Take over from the CSS safety net before animating anything.
        gsap.set(paths, { animation: "none", strokeDashoffset: 1 });
        gsap.to(paths, {
          strokeDashoffset: 0,
          duration: 2.2,
          ease: "power2.inOut",
          // Lowest first, so the mountain rises out of the plain.
          stagger: { each: 0.07, from: "start" },
        });
        gsap.from("[data-summit]", {
          autoAlpha: 0,
          y: 8,
          duration: 0.8,
          ease: EASE,
          delay: 1.4,
          stagger: 0.15,
        });

        // A drift of a few pixels toward the pointer: the map has depth
        // without anything on it moving far enough to be read as motion.
        const fine = window.matchMedia("(pointer: fine)").matches;
        if (fine && plane.current) {
          const toX = gsap.quickTo(plane.current, "x", { duration: 1.2, ease: EASE });
          const toY = gsap.quickTo(plane.current, "y", { duration: 1.2, ease: EASE });
          const onMove = (event: PointerEvent) => {
            toX((event.clientX / window.innerWidth - 0.5) * -14);
            toY((event.clientY / window.innerHeight - 0.5) * -10);
          };
          window.addEventListener("pointermove", onMove);
          return () => window.removeEventListener("pointermove", onMove);
        }
      });

      const trigger = ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => {
          const step = Math.min(order.length - 1, Math.floor(self.progress * order.length));
          setLit(order[step]);
        },
      });

      return () => {
        trigger.kill();
        mm.revert();
      };
    },
    { scope: root },
  );

  const litMetres = lines[lit]?.metres ?? 0;

  return (
    <div ref={root} className="relative h-full" aria-hidden="true">
      <svg
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        preserveAspectRatio="xMidYMid slice"
        className="fh-contour block h-full w-full"
      >
        <g ref={plane}>
          {lines.map((line, i) => (
            <path key={i} d={line.d} pathLength={1} data-active={i === lit ? "true" : undefined} />
          ))}
          {summits.map((summit) => (
            <g key={summit.name} data-summit transform={`translate(${summit.x} ${summit.y})`}>
              {/* A polygon, not a path: the contour rules draw every path as a line. */}
              <polygon points="-5,4 0,-5 5,4" className="fill-ink" />
              <text
                x={12}
                y={4}
                className="fh-mono fill-mute text-[11px] tracking-[0.1em]"
              >
                <tspan className="uppercase">{summit.name}</tspan> {formatMetres(summit.metres)}
              </text>
            </g>
          ))}
        </g>
      </svg>
      <p className="fh-mono absolute right-6 bottom-2 text-[11px] lg:right-20 lg:bottom-8 tracking-[0.1em] text-mute tabular-nums">
        <span className="mr-2 inline-block h-px w-6 translate-y-[-3px] bg-sulfur-mark align-middle" />
        {formatMetres(litMetres)}
      </p>
    </div>
  );
}
