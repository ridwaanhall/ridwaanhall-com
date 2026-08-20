import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld";
import { HomeIntro } from "@/components/site/home-intro";
import { LatestBlogs } from "@/components/site/latest-blogs";
import { SkillsMarquee } from "@/components/site/skills-marquee";
import { SponsorMe } from "@/components/site/sponsor-me";
import { getAboutData, getSkills } from "@/lib/data/about";
import { getBlogs, toBlogSummary } from "@/lib/data/content";
import { homepageSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { homepageSchemas } from "@/lib/seo/schemas-for-page";
import { MARQUEE_SEEDS, shuffle } from "@/lib/utils/shuffle";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutData();
  if (!about) return {};
  return buildMetadata(homepageSeo(about), about);
}

export default async function HomePage() {
  const [about, blogs, skills] = await Promise.all([getAboutData(), getBlogs(), getSkills()]);
  if (!about) return null;

  // The third donate link is the sponsor URL, which is also what the search
  // palette's "Support" entry points at.
  const sponsorUrl = about.donate[2]?.url ?? "";
  const latest = blogs.slice(0, 5).map(toBlogSummary);
  const marqueeRows = MARQUEE_SEEDS.map((seed) => shuffle(skills, seed)) as [
    typeof skills,
    typeof skills,
    typeof skills,
  ];

  const hasBlogs = latest.length > 0;
  const hasSkills = skills.length > 0;
  const hasSponsor = Boolean(sponsorUrl);

  return (
    <>
      <JsonLdScript schemas={await homepageSchemas(about)} />
      <main className="px-4 py-6 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <HomeIntro about={about} sponsorUrl={sponsorUrl} />

          <Divider />

          {hasBlogs && (
            <>
              <LatestBlogs blogs={latest} />
              {(hasSkills || hasSponsor) && <Divider />}
            </>
          )}

          {hasSkills && (
            <>
              <SkillsMarquee rows={marqueeRows} />
              {hasSponsor && <Divider />}
            </>
          )}

          {hasSponsor && <SponsorMe sponsorUrl={sponsorUrl} />}
        </div>
      </main>
    </>
  );
}

function Divider() {
  return <div className="w-full mx-auto border-t border-zinc-700 my-4 md:my-6 lg:my-6" />;
}
