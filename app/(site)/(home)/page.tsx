import type { Metadata } from "next";
import Link from "next/link";

import { CardGrid } from "@/components/foothill/cards";
import {H3, META } from "@/components/foothill/classes";
import { MAIN, WRAP } from "@/components/foothill/layout";
import { PageMotion, Reveal } from "@/components/foothill/motion";
import { Portrait } from "@/components/foothill/portrait";
import { featuredProjects, monthYearLabel, postCard, projectCard } from "@/components/foothill/rows";
import { SkillMarquee } from "@/components/foothill/skill-marquee";
import { ActionLink, Heading, Logo, SectionHead } from "@/components/foothill/ui";
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
const listed = (names: string[]) =>
  names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : (names[0] ?? "");
// Lower-case a sentence's first letter to run it on after a comma -- but not
// a name: "RoneAI" stays as it is.
const lower = (text: string) => {
  const word = text.split(" ")[0] ?? "";
  return word.slice(1) === word.slice(1).toLowerCase() ? text.charAt(0).toLowerCase() + text.slice(1) : text;
};

export default async function HomePage() {
  const [about, blogs, projects, skills, current] = await Promise.all([
    getAboutData(),
    getBlogs(),
    getProjects(),
    getSkills(),
    getExperiences(true),
  ]);
  if (!about) return null;

  const sorted = sortProjects(projects);
  const featured = featuredProjects(sorted);
  const selected = (featured.length ? featured : sorted).slice(0, 4);
  const status = availability(about);
  const highlighted = new Set(about.skills);
  const rest = shuffle(
    skills.filter((skill) => !highlighted.has(skill.name)),
    MARQUEE_SEEDS[0],
  );
  const half = Math.ceil(rest.length / 2);
  const sponsor = about.donate[2];
  const first = about.first_name || about.name.split(" ")[0];
  const last = about.last_name || about.name.split(" ").slice(1).join(" ");

  return (
    <main className={MAIN}>
      <JsonLdScript schemas={await homepageSchemas(about)} />
      {/* The hero: who, what he does, and his face. First in `<main>` and a
          plain wrapper: the route's skeleton is measured against the page's
          first block. */}
      <div className={WRAP}>
        <div className="fh-frame grid items-end gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <h1
              data-fh-split
              data-fh-hold
              className="font-display text-[clamp(3rem,1.4rem+6.4vw,7rem)] leading-[0.88] font-semibold tracking-[-0.055em] text-ink"
            >
              {first}
              <br />
              {last}
            </h1>
            <p
              data-fh-enter
              data-fh-hold
              className="mt-8 max-w-[30ch] text-[clamp(1.2rem,1.05rem+0.6vw,1.55rem)] leading-[1.35] tracking-[-0.01em] text-ink"
            >
              {about.role}. {sentence(about.short_description)}
            </p>

            <div data-fh-enter data-fh-hold className="mt-10 flex flex-wrap items-center gap-3">
              <ActionLink href="/projects" variant="solid">
                See the work
              </ActionLink>
              <ActionLink href="/contact" variant="line" icon="mail">
                Write to me
              </ActionLink>
            </div>

            {status.length > 0 && (
              <ul data-fh-enter data-fh-hold className="mt-10 flex flex-col gap-2 text-[15px]">
                {status.map((line) => (
                  <li key={line.key} className="flex items-center gap-3">
                    <span aria-hidden="true" className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sulfur-mark opacity-60 motion-reduce:hidden" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-sulfur-mark" />
                    </span>
                    {line.href ? (
                      <Link href={line.href} className="group text-ink">
                        <span className="fh-underline">{line.label}</span>
                        <span className="text-mute">, {lower(line.detail)}</span>
                      </Link>
                    ) : (
                      <span className="text-ink">
                        {line.label}
                        <span className="text-mute">, {lower(line.detail)}</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {about.image_url && (
            <Portrait
              src={about.image_url}
              alt={about.image_alt || `${about.name}, drawn in horizontal lines`}
              caption={about.portrait === "photo" ? "Drawn line by line from a photograph." : undefined}
              className="mx-auto hidden w-full max-w-[420px] md:block lg:col-span-5 lg:max-w-none"
            />
          )}
        </div>
      </div>

      <div className={WRAP}>
        {selected.length > 0 && (
          <section aria-labelledby="home-work" className="mt-32 md:mt-44">
            <SectionHead
              id="home-work"
              title={featured.length ? "Selected work" : "Recent work"}
              count={projects.length}
              href="/projects"
              linkLabel="All the work"
            />
            <CardGrid cards={selected.map(projectCard)} batch={selected.length} className="mt-12" />
          </section>
        )}

        {current.length > 0 && (
          <section aria-labelledby="home-now" className="mt-32 md:mt-44">
            <div className="grid gap-12 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <Heading id="home-now">Right now</Heading>
                <Reveal as="p" className="mt-6 max-w-[40ch] text-[18px] leading-relaxed text-mute">
                  {sentence(about.short_bio.split(". ")[0])}.
                </Reveal>
                <ActionLink href="/about" className="mt-8">
                  The longer story
                </ActionLink>
              </div>
              <Reveal as="ul" stagger className="grid gap-10 sm:grid-cols-2 lg:col-span-7 lg:gap-y-12">
                {current.map((role) => (
                  <li key={role.id} className="group">
                    <Logo src={role.logo} name={role.company} />
                    <p className={`${H3} mt-5`}>{role.title}</p>
                    <p className={`${META} mt-2`}>
                      {role.website ? (
                        <a href={role.website} target="_blank" rel="noopener noreferrer" className="fh-link text-ink">
                          {role.company}
                        </a>
                      ) : (
                        <span className="text-ink">{role.company}</span>
                      )}
                      {role.location_type && `, ${role.location_type.toLowerCase()}`}
                    </p>
                    <p className={`${META} mt-1`}>Since {monthYearLabel(role.period.start)}</p>
                  </li>
                ))}
              </Reveal>
            </div>
          </section>
        )}

        {blogs.length > 0 && (
          <section aria-labelledby="home-writing" className="mt-32 md:mt-44">
            <SectionHead
              id="home-writing"
              title="Writing"
              count={blogs.length}
              href="/blog"
              linkLabel="All the writing"
            />
            <CardGrid cards={blogs.slice(0, 3).map(postCard)} batch={3} rhythm={false} className="mt-12" />
          </section>
        )}

        {about.skills.length > 0 && (
          <section aria-labelledby="home-toolkit" className="mt-32 md:mt-44">
            <h2 id="home-toolkit" className="sr-only">
              Toolkit
            </h2>
            <Reveal
              as="p"
              lines
              className="max-w-[24ch] font-display text-[clamp(1.75rem,1.3rem+2vw,3rem)] leading-[1.05] font-medium tracking-[-0.035em] text-ink"
            >
              {`Most days it is ${listed(about.skills)}. The other ${rest.length} drift past below.`}
            </Reveal>
          </section>
        )}
      </div>

      {rest.length > 0 && (
        <div className="mt-12 space-y-0">
          <SkillMarquee skills={rest.slice(0, half)} />
          <SkillMarquee skills={rest.slice(half)} reverse className="-mt-px" />
        </div>
      )}

      <div className={WRAP}>
        <section className="mt-32 md:mt-44">
          <Reveal
            as="p"
            lines
            className="max-w-[20ch] font-display text-[clamp(1.9rem,1.3rem+2.6vw,3.5rem)] leading-[1.04] font-medium tracking-[-0.04em] text-ink"
          >
            {sentence(about.short_cta)}
          </Reveal>
          <Reveal className="mt-10 flex flex-wrap items-center gap-3">
            <ActionLink href="/about" variant="solid">
              Read about me
            </ActionLink>
            <ActionLink href="/guestbook" variant="line" icon="reply">
              Sign the guestbook
            </ActionLink>
            {sponsor?.url && (
              <ActionLink href={sponsor.url} className="ml-2 text-mute">
                {`Support on ${sponsor.platform}`}
              </ActionLink>
            )}
          </Reveal>
        </section>
      </div>
      <PageMotion />
    </main>
  );
}
