import type { Metadata } from "next";
import Link from "next/link";

import { EYEBROW, LINE_BUTTON, SOLID_BUTTON } from "@/components/foothill/classes";
import { ContourField } from "@/components/foothill/contour-field";
import { contours, SUMMITS } from "@/components/foothill/contours";
import { MAIN, WRAP } from "@/components/foothill/layout";
import { PageMotion } from "@/components/foothill/page-motion";
import { PostList } from "@/components/foothill/post-list";
import { featuredProjects, monthYearLabel, postRow, workRow } from "@/components/foothill/rows";
import { SkillMarquee } from "@/components/foothill/skill-marquee";
import { Arrow, SectionHead } from "@/components/foothill/ui";
import { WorkIndex } from "@/components/foothill/work-index";
import { JsonLdScript } from "@/components/seo/json-ld";
import { getAboutData, getExperiences, getSkills } from "@/lib/data/about";
import { getBlogs, getProjects, sortProjects } from "@/lib/data/content";
import { homepageSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { homepageSchemas } from "@/lib/seo/schemas-for-page";
import { availability } from "@/lib/site/display";
import { MARQUEE_SEEDS, shuffle } from "@/lib/utils/shuffle";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutData();
  if (!about) return {};
  return buildMetadata(homepageSeo(about), about);
}

const sentence = (text: string) => (text ? text[0].toUpperCase() + text.slice(1) : text);

export default async function HomePage() {
  const [about, blogs, projects, skills, current] = await Promise.all([
    getAboutData(),
    getBlogs(),
    getProjects(),
    getSkills(),
    getExperiences(true),
  ]);
  if (!about) return null;

  const featured = featuredProjects(sortProjects(projects));
  const selected = (featured.length ? featured : sortProjects(projects)).slice(0, 6);
  const latest = blogs.slice(0, 5);
  const status = availability(about);
  const highlighted = new Set(about.skills);
  const rest = shuffle(
    skills.filter((skill) => !highlighted.has(skill.name)),
    MARQUEE_SEEDS[0],
  );
  const sponsor = about.donate[2];
  const place = [about.location.residency || about.location.regency, about.location.country]
    .filter(Boolean)
    .join(", ");

  return (
    <main className={MAIN}>
      <JsonLdScript schemas={await homepageSchemas(about)} />
      {/* The hero: who, what, and where -- the where drawn as the land. On
          a wide screen the map runs off the right edge behind the text. */}
      <section className="relative overflow-hidden lg:min-h-[620px]">
        <div className={WRAP}>
          <div className="relative z-10 max-w-[560px] lg:pt-10 lg:pb-20">
            <p data-fh-enter data-fh-hold className={EYEBROW}>
              {place} <span className="mx-1.5 text-line">/</span> 7.53°S 110.60°E
            </p>
            <h1
              data-fh-split
              data-fh-hold
              className="mt-6 text-[clamp(3.25rem,2rem+6.5vw,7.5rem)] leading-[0.92] font-semibold tracking-[-0.045em] text-ink"
            >
              {about.first_name || about.name.split(" ")[0]}
              <br />
              {about.last_name || about.name.split(" ").slice(1).join(" ")}
            </h1>
            <p data-fh-enter data-fh-hold className="mt-7 text-[clamp(1.125rem,1rem+0.4vw,1.3rem)] text-ink">
              {about.role}
            </p>
            <p
              data-fh-enter
              data-fh-hold
              className="fh-serif mt-3 max-w-[34ch] text-[clamp(1.25rem,1.05rem+0.8vw,1.65rem)] leading-[1.35] text-mute italic"
            >
              {sentence(about.short_description)}
            </p>

            {status.length > 0 && (
              <ul data-fh-enter data-fh-hold className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
                {status.map((line) => {
                  const body = (
                    <>
                      <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-sulfur-mark" />
                      <span className="text-ink">{line.label}</span>
                      <span className="text-mute">— {line.detail}</span>
                    </>
                  );
                  return (
                    <li key={line.key}>
                      {line.href ? (
                        <Link href={line.href} className="inline-flex items-center gap-2 hover:underline">
                          {body}
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-2">{body}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <div data-fh-enter data-fh-hold className="mt-10 flex flex-wrap gap-3">
              <Link href="/projects" className={`group ${SOLID_BUTTON}`}>
                See the work <Arrow />
              </Link>
              <Link href="/contact" className={LINE_BUTTON}>
                Write to me
              </Link>
            </div>
          </div>
        </div>
        <div className="relative mt-14 h-[280px] sm:h-[380px] lg:absolute lg:inset-y-0 lg:right-[-4%] lg:mt-0 lg:h-auto lg:w-[64%] lg:[mask-image:linear-gradient(to_right,transparent,black_32%)]">
          <ContourField lines={contours()} summits={SUMMITS} />
        </div>
      </section>

      <div className={WRAP}>
        {selected.length > 0 && (
          <section aria-labelledby="home-work" className="mt-28 md:mt-40">
            <SectionHead
              id="home-work"
              label={featured.length ? "Selected work" : "Recent work"}
              count={projects.length}
              href="/projects"
              linkLabel="All work"
            />
            <div className="mt-2">
              <WorkIndex rows={selected.map(workRow)} />
            </div>
          </section>
        )}

        {current.length > 0 && (
          <section aria-labelledby="home-now" className="mt-28 md:mt-36">
            <SectionHead id="home-now" label="Now" href="/about" linkLabel="The longer story" />
            <div className="mt-8 grid gap-10 md:grid-cols-12">
              <p data-fh-reveal className="fh-serif text-[22px] leading-[1.4] text-ink md:col-span-5">
                {sentence(about.short_bio.split(". ")[0])}.
              </p>
              <ul data-fh-reveal data-fh-stagger className="md:col-span-6 md:col-start-7">
                {current.map((role) => (
                  <li
                    key={role.id}
                    className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 border-b border-line py-4 first:border-t"
                  >
                    <span>
                      <span className="block text-[17px] text-ink">{role.title}</span>
                      <span className="mt-0.5 block text-[14px] text-mute">
                        {role.website ? (
                          <a href={role.website} target="_blank" rel="noopener noreferrer" className="fh-link">
                            {role.company}
                          </a>
                        ) : (
                          role.company
                        )}
                        {role.location_type && ` · ${role.location_type}`}
                      </span>
                    </span>
                    <span className="fh-mono text-[12px] text-mute">
                      since {monthYearLabel(role.period.start)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {latest.length > 0 && (
          <section aria-labelledby="home-writing" className="mt-28 md:mt-36">
            <SectionHead
              id="home-writing"
              label="Writing"
              count={blogs.length}
              href="/blog"
              linkLabel="All writing"
            />
            <PostList posts={latest.map(postRow)} className="mt-2" />
          </section>
        )}

        {skills.length > 0 && (
          <section aria-labelledby="home-toolkit" className="mt-28 md:mt-36">
            <SectionHead id="home-toolkit" label="Toolkit" count={skills.length} />
            {about.skills.length > 0 && (
              <p
                data-fh-reveal
                className="mt-8 max-w-[22ch] text-[clamp(2rem,1.4rem+2.6vw,3.5rem)] leading-[1.05] font-medium tracking-[-0.03em] text-ink"
              >
                {about.skills.map((name, index) => (
                  <span key={name}>
                    {name}
                    {index < about.skills.length - 1 && <span className="text-sulfur">, </span>}
                  </span>
                ))}
                <span className="text-mute">, and the rest below.</span>
              </p>
            )}
          </section>
        )}
      </div>

      {rest.length > 0 && <SkillMarquee skills={rest} className="mt-12" />}

      <div className={WRAP}>
        <section className="mt-28 border-t border-line pt-16 md:mt-40 md:pt-24">
          <p
            data-fh-reveal
            className="fh-serif max-w-[22ch] text-[clamp(2rem,1.3rem+3vw,4rem)] leading-[1.08] tracking-[-0.01em] text-ink"
          >
            {sentence(about.short_cta)}
          </p>
          <div data-fh-reveal className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/about" className={`group ${SOLID_BUTTON}`}>
              Read about me <Arrow />
            </Link>
            <Link href="/guestbook" className={LINE_BUTTON}>
              Sign the guestbook
            </Link>
            {sponsor?.url && (
              <a
                href={sponsor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group ml-1 text-[15px] text-mute transition-colors hover:text-ink"
              >
                Support on {sponsor.platform} <Arrow diagonal />
              </a>
            )}
          </div>
        </section>
      </div>
      <PageMotion />
    </main>
  );
}
