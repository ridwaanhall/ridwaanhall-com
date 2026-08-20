import type { Skill } from "@/lib/data/about";

/**
 * The "Tools I've Used" marquee: three rows scrolling in alternating directions.
 *
 * The motion is a CSS animation from styles/skillSlider.css -- `.skills-carousel`
 * and `.skills-carousel-reverse` translate the row by -100%, and each row's
 * contents are rendered **twice** so the wrap is seamless. That duplication is
 * load-bearing, not a mistake.
 */
export function SkillsMarquee({ rows }: { rows: [Skill[], Skill[], Skill[]] }) {
  if (rows.every((row) => row.length === 0)) return null;

  return (
    <>
      <div className="flex flex-row items-center justify-between gap-2 mb-3 md:mb-4">
        <h2 className="text-xl sm:text-2xl font-medium">
          Tools <span className="text-indigo-400">I&apos;ve Used</span>
        </h2>
      </div>

      {rows.map((skills, index) => (
        <div key={index} className="overflow-hidden-skills w-full relative">
          <div
            className={`flex w-fit whitespace-nowrap py-2 ${
              // Middle row runs the other way, so the three do not read as one block.
              index === 1 ? "skills-carousel-reverse" : "skills-carousel"
            }`}
          >
            {[...skills, ...skills].map((skill, i) => (
              <div key={`${skill.name}-${i}`} className="inline-block mx-1.5 whitespace-nowrap">
                <div className="rounded-full bg-zinc-900 backdrop-blur-sm border border-zinc-700 hover:border-zinc-400 transition-all duration-300 px-4 py-2 flex items-center gap-2">
                  {/*
                    A plain <img>, not next/image. These are 20px SVGs: the
                    optimizer refuses SVG by default (rasterising one is a
                    security footgun and would look worse anyway), and there is
                    no responsive ladder to generate for a fixed 20px mark.
                  */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={localIconUrl(skill.icon_svg)}
                    alt={skill.name}
                    className="w-5 h-5"
                    width={20}
                    height={20}
                    loading="lazy"
                  />
                  <span className="font-medium text-sm">{skill.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

/**
 * Serve a skill icon from this origin.
 *
 * `about_skill.icon_svg` stores absolute URLs into `https://ridwaanhall.com/
 * static/svg/icon/…`. Those files are served from `public/static/svg/`, so in
 * production the absolute and relative forms are the same bytes -- but the
 * absolute one makes local development fetch 78 icons from the live site,
 * which is slow, offline-hostile, and quietly depends on production being up.
 *
 * Only this exact prefix is rewritten. Anything else is left alone, so a skill
 * whose icon genuinely lives elsewhere keeps working.
 */
function localIconUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?ridwaanhall\.com\/static\//, "/static/");
}
