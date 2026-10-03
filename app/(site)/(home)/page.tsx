import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld";
import { Reveal } from "@/components/motion/reveal";
import { SkillTicker } from "@/components/motion/skill-ticker";
import { BlogList, ProjectGrid } from "@/components/site/content-rows";
import { HomeIntro } from "@/components/site/home-intro";
import { SponsorMe } from "@/components/site/sponsor-me";
import { ArrowLink, CONTAINER, Section } from "@/components/site/ui";
import { getAboutData, getSkills } from "@/lib/data/about";
import { getBlogs, getProjects, sortProjects, toBlogSummary, toProjectSummary } from "@/lib/data/content";
import { homepageSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { homepageSchemas } from "@/lib/seo/schemas-for-page";
import { MARQUEE_SEEDS, shuffle } from "@/lib/utils/shuffle";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutData();
  if (!about) return {};
  return buildMetadata(homepageSeo(about), about);
}

/**
 * The home page: who, what has been made, what has been written, with what.
 *
 * Selected work is new here. The old home page linked to the projects only
 * through the navigation, which buried the thing a portfolio is for; the four
 * shown are the head of `sortProjects`, the same order /projects opens with.
 */
export default async function HomePage() {
  const [about, blogs, projects, skills] = await Promise.all([
    getAboutData(),
    getBlogs(),
    getProjects(),
    getSkills(),
  ]);
  if (!about) return null;

  const sponsorUrl = about.donate[2]?.url ?? "";
  const latest = blogs.slice(0, 5).map(toBlogSummary);
  const selected = sortProjects(projects).slice(0, 4).map(toProjectSummary);
  const tickerRows = MARQUEE_SEEDS.slice(0, 2).map((seed) => shuffle(skills, seed));

  return (
    <>
      <JsonLdScript schemas={await homepageSchemas(about)} />
      <main className={CONTAINER}>
        <HomeIntro about={about} sponsorUrl={sponsorUrl} />

        {selected.length > 0 && (
          <Section
            title="Selected work"
            marker={`${selected.length} of ${projects.length} projects`}
            action={<ArrowLink href="/projects">All projects</ArrowLink>}
          >
            <ProjectGrid projects={selected} />
          </Section>
        )}

        {latest.length > 0 && (
          <Section
            title="Latest writing"
            marker={`${latest.length} of ${blogs.length} posts`}
            action={<ArrowLink href="/blog">All posts</ArrowLink>}
          >
            <BlogList posts={latest} />
          </Section>
        )}

        {skills.length > 0 && (
          <Section title="Tools I've used" marker={`${skills.length} tools`}>
            <Reveal>
              <SkillTicker rows={tickerRows} />
            </Reveal>
          </Section>
        )}

        <SponsorMe sponsorUrl={sponsorUrl} />
      </main>
    </>
  );
}
