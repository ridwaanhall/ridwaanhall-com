import type { Skill } from "@/lib/data/about";
import { cn } from "@/lib/utils/cn";

/**
 * Every other skill, drifting past in one line.
 *
 * The list is drawn twice and the track slides by exactly half its width, so
 * the seam never shows. Pure CSS (`.fh-marquee-track` in styles/site.css),
 * paused on hover and still under reduced motion -- where it becomes a row a
 * reader can scroll sideways instead.
 */
export function SkillMarquee({
  skills,
  reverse = false,
  className,
}: {
  skills: Skill[];
  /** Runs the other way: two rows passing each other read as one band. */
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "fh-marquee overflow-x-auto overflow-y-hidden border-y border-line motion-safe:overflow-x-hidden",
        className,
      )}
      aria-label="Other tools I use"
      role="region"
    >
      <ul className="fh-marquee-track flex w-max" data-reverse={reverse || undefined}>
        {[0, 1].map((copy) =>
          skills.map((skill) => (
            <li
              key={`${copy}-${skill.name}`}
              aria-hidden={copy === 1 ? "true" : undefined}
              className="group flex items-center gap-2.5 border-r border-line px-6 py-4"
              title={skill.description || skill.category}
            >
              {skill.icon_svg && (
                // eslint-disable-next-line @next/next/no-img-element -- tiny SVG icons, no optimisation to gain
                <img
                  src={skill.icon_svg}
                  alt=""
                  width={18}
                  height={18}
                  loading="lazy"
                  className="fh-icon-adapt h-[18px] w-[18px]"
                />
              )}
              <span className="text-[16px] whitespace-nowrap text-mute transition-colors group-hover:text-ink">
                {skill.name}
              </span>
            </li>
          )),
        )}
      </ul>
    </div>
  );
}
