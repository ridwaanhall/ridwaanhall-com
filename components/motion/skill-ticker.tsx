"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

import type { Skill } from "@/lib/data/about";
import { localIconUrl } from "@/lib/utils/icon-url";

gsap.registerPlugin(useGSAP);

/**
 * The tools, drifting past in rows that run in opposite directions.
 *
 * GSAP rather than a CSS keyframe, for one reason: hovering a row eases it
 * down to a crawl instead of stopping it dead, which a CSS animation cannot do
 * without a jump. Each track holds its items twice and moves by exactly half
 * its own width, so the loop seam is never seen.
 *
 * With reduced motion there is no loop at all -- the first row's items are
 * laid out as a plain wrapped list, every tool still named.
 */
export function SkillTicker({ rows }: { rows: Skill[][] }) {
  const root = useRef<HTMLDivElement>(null);
  const visible = rows.filter((row) => row.length > 0);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tracks = gsap.utils.toArray<HTMLElement>("[data-ticker-track]");
        const cleanups = tracks.map((track, index) => {
          const half = track.scrollWidth / 2;
          const tween = gsap.fromTo(
            track,
            { x: index % 2 ? -half : 0 },
            {
              x: index % 2 ? 0 : -half,
              duration: half / 40,
              ease: "none",
              repeat: -1,
            },
          );
          const row = track.parentElement!;
          const slow = () => gsap.to(tween, { timeScale: 0.15, duration: 0.6, ease: "power2.out" });
          const resume = () => gsap.to(tween, { timeScale: 1, duration: 0.8, ease: "power2.in" });
          row.addEventListener("pointerenter", slow);
          row.addEventListener("pointerleave", resume);
          return () => {
            row.removeEventListener("pointerenter", slow);
            row.removeEventListener("pointerleave", resume);
          };
        });
        return () => cleanups.forEach((cleanup) => cleanup());
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  if (visible.length === 0) return null;

  return (
    <div ref={root}>
      {/* Reduced motion: one static list. */}
      <ul className="hidden flex-wrap gap-x-6 gap-y-3 motion-reduce:flex">
        {visible[0].map((skill) => (
          <li key={skill.name}>
            <SkillItem skill={skill} />
          </li>
        ))}
      </ul>

      <div className="space-y-5 motion-reduce:hidden">
        {visible.map((skills, index) => (
          <div key={index} className="ticker overflow-hidden">
            <ul data-ticker-track className="ticker-track" aria-hidden={index > 0 || undefined}>
              {[...skills, ...skills].map((skill, i) => (
                // The second copy exists only to close the loop; a screen
                // reader is given each tool once.
                <li key={`${skill.name}-${i}`} className="pr-10" aria-hidden={i >= skills.length || undefined}>
                  <SkillItem skill={skill} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillItem({ skill }: { skill: Skill }) {
  return (
    <span className="flex items-center gap-2.5 whitespace-nowrap text-zinc-400 transition-colors hover:text-zinc-100">
      {/* A plain <img>: these are 20px SVGs, which the optimiser refuses and
          has nothing to gain from. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={localIconUrl(skill.icon_svg)} alt="" className="h-5 w-5" width={20} height={20} loading="lazy" />
      <span className="text-base">{skill.name}</span>
    </span>
  );
}
