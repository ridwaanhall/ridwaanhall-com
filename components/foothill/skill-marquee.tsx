"use client";

import { useRef } from "react";

import { SkillChip, type SkillIcon } from "@/components/foothill/ui";
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";

/**
 * Every skill with its icon, drifting past in two rows that run opposite ways
 * and quicken with the speed of the scroll.
 *
 * Each row is drawn twice and slides by exactly half its width, so the seam
 * never shows. Under reduced motion the rows stand still and scroll sideways
 * by hand instead.
 */
export function SkillMarquee({ skills }: { skills: SkillIcon[] }) {
  const root = useRef<HTMLDivElement>(null);
  const half = Math.ceil(skills.length / 2);
  const rows = [skills.slice(0, half), skills.slice(half)];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        root.current?.querySelectorAll<HTMLElement>(".marq-row").forEach((row, index) => {
          const loop = gsap.fromTo(
            row,
            { xPercent: index % 2 ? -50 : 0 },
            { xPercent: index % 2 ? 0 : -50, duration: 80, ease: "none", repeat: -1 },
          );
          ScrollTrigger.create({
            trigger: row,
            start: "top bottom",
            end: "bottom top",
            onUpdate: (self) => {
              const boost = Math.min(Math.abs(self.getVelocity()) / 300, 5);
              gsap.to(loop, { timeScale: 1 + boost, duration: 0.25, overwrite: true });
              gsap.to(loop, { timeScale: 1, duration: 1.2, delay: 0.25 });
            },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="marq" role="region" aria-label="Every skill">
      {rows.map((row, index) => (
        <div key={index} className="marq-row">
          {[0, 1].map((copy) =>
            row.map((skill) => (
              <span key={`${copy}-${skill.name}`} aria-hidden={copy === 1 ? true : undefined}>
                <SkillChip skill={skill} />
              </span>
            )),
          )}
        </div>
      ))}
    </div>
  );
}
