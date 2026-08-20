import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld";
import {
  AwardCard,
  CertificationCard,
  EducationCard,
  ExperienceCard,
} from "@/components/site/about-cards";
import { AboutTabs } from "@/components/site/about-tabs";
import { ApplicationCard } from "@/components/site/application-card";
import { CvDownload } from "@/components/site/cv-download";
import { SponsorMe } from "@/components/site/sponsor-me";
import type { AboutData, Experience } from "@/lib/data/about";
import {
  getAboutData,
  getApplications,
  getAwards,
  getCertifications,
  getEducation,
  getExperiences,
} from "@/lib/data/about";
import { aboutSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { aboutSchemas } from "@/lib/seo/schemas-for-page";
// Stories are author-written HTML fragments; same allow-list as the blog body.
import { sanitizeRichText as sanitizeStory } from "@/lib/utils/sanitize";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutData();
  if (!about) return {};
  return buildMetadata(aboutSeo(about), about);
}

export default async function AboutPage() {
  const [about, experiences, education, awards, certifications, applications] = await Promise.all([
    getAboutData(),
    getExperiences(),
    getEducation(),
    getAwards(),
    getCertifications(),
    getApplications(),
  ]);
  if (!about) return null;

  const sponsorUrl = about.donate[2]?.url ?? "";

  const tabs = [
    {
      id: "intro",
      label: "Intro",
      content: <Intro about={about} sponsorUrl={sponsorUrl} />,
    },
    {
      id: "experiences",
      label: "Experiences",
      content: (
        <Section>
          {groupByCompany(experiences).map(([company, roles]) => (
            <ExperienceCard key={company} company={company} roles={roles} />
          ))}
        </Section>
      ),
    },
    {
      id: "education",
      label: "Education",
      content: (
        <Section>
          {education.map((item) => (
            <EducationCard key={`${item.degree}-${item.institution}`} education={item} />
          ))}
        </Section>
      ),
    },
    {
      id: "awards",
      label: "Awards",
      content: (
        <Section>
          {awards.map((award) => (
            <AwardCard key={award.id} award={award} />
          ))}
        </Section>
      ),
    },
    {
      id: "certifications",
      label: "Certifications",
      content: (
        <div className="mt-4 sm:mt-6">
          <LinkedInCertifications username={about.username} />
          <div className="space-y-3 sm:space-y-4">
            {certifications.map((certification) => (
              <CertificationCard key={certification.id} certification={certification} />
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "applications",
      label: "Applications",
      content: (
        <div className="mt-4">
          <div className="space-y-4">
            {applications.length > 0 ? (
              applications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))
            ) : (
              <p className="text-zinc-400">No applications found.</p>
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <JsonLdScript schemas={await aboutSchemas(about)} />
      <main className="px-3 py-4 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 md:mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
              <div>
                <h1 className="text-2xl lg:text-3xl font-medium mb-2 tracking-tight">
                  About <span className="text-indigo-400">Me</span>
                </h1>
                <p className="mt-2 text-base sm:text-lg text-zinc-300 leading-relaxed">
                  Built on belief and shaped through code. This is the path I&rsquo;ve taken, and
                  the trace I continue leaving.
                </p>
              </div>
            </div>
          </div>

          <AboutTabs tabs={tabs} />
        </div>
      </main>
    </>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 sm:mt-6">
      <div className="space-y-3 sm:space-y-4">{children}</div>
    </div>
  );
}

function Intro({ about, sponsorUrl }: { about: AboutData; sponsorUrl: string }) {
  const badges = [
    about.is_open_to_work && {
      key: "open",
      className: "bg-green-900/30 text-green-400 border-green-800/50",
      dot: "bg-green-500",
      label: "Open to Work",
    },
    about.is_hiring && {
      key: "hiring",
      className: "bg-blue-900/30 text-blue-400 border-blue-800/50",
      dot: "bg-blue-500",
      label: "Hiring",
    },
    about.is_sick && {
      key: "sick",
      className: "bg-amber-900/30 text-amber-400 border-amber-800/50",
      dot: "bg-amber-500",
      label: "Under the Weather",
      title: "Currently unwell — replies may be slow",
    },
  ].filter(Boolean) as {
    key: string;
    className: string;
    dot: string;
    label: string;
    title?: string;
  }[];

  return (
    <div className="mt-4 sm:mt-6">
      <CvDownload />

      <div className="space-y-3 sm:space-y-4">
        <div className="border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-all duration-300">
          {/*
            `flex-wrap` on both rows, which the original had on neither. With
            all three flags set the badges are 258px of content next to a 148px
            heading, so at 375px the third one started 24px *past* the right
            edge of the viewport and the whole page scrolled sideways. Above
            `sm` there is room for one line and nothing moves, so this only
            ever takes effect where the original was broken.
          */}
          <div className="flex flex-wrap items-center justify-between gap-y-2 mb-2 sm:mb-3">
            <p className="text-indigo-400 text-lg sm:text-xl font-medium">Assalamu&apos;alaikum</p>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <span
                  key={badge.key}
                  className={`pill-badge px-3 py-1.5 text-sm border ${badge.className}`}
                  title={badge.title}
                >
                  <span className={`w-2 h-2 rounded-full mr-2 animate-pulse ${badge.dot}`} />
                  <span className="hidden sm:inline mr-1">Currently </span>
                  {badge.label}
                </span>
              ))}
            </div>
          </div>

          {/*
            `stories` is a list of paragraphs that may carry inline markup --
            Django rendered each with `|safe`. They come from the admin, so the
            same sanitiser the blog body uses applies here.
          */}
          {about.stories.map((story, index) => (
            <div key={index} className="mb-2">
              <p dangerouslySetInnerHTML={{ __html: sanitizeStory(String(story)) }} />
            </div>
          ))}

          <p className="text-indigo-400 text-lg sm:text-xl font-medium mt-3 sm:mt-3">
            Wassalamu&apos;alaikum
          </p>
        </div>

        <SponsorMe sponsorUrl={sponsorUrl} />
      </div>
    </div>
  );
}

function LinkedInCertifications({ username }: { username: string }) {
  return (
    <div className="mb-6 p-4 rounded-lg border border-zinc-700/50 bg-zinc-800/30 hover:border-zinc-600 transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 text-indigo-400"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-200">View All 115+ Certifications</h3>
          <p className="text-xs text-blue-300/80 mt-1">
            See my complete certification portfolio on LinkedIn
          </p>
        </div>
        <a
          href={`https://linkedin.com/in/${username}/details/certifications/`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-600 hover:border-zinc-500 hover:bg-zinc-700/50 text-blue-200 transition-all duration-200"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          View on LinkedIn
        </a>
      </div>
    </div>
  );
}

/**
 * Group roles by company, preserving the order they arrive in.
 *
 * Django did this with `{% regroup experiences by company %}`, which groups
 * *consecutive* runs rather than collecting every occurrence -- so the manager's
 * `sort_order` is what keeps a company's roles adjacent. A Map preserves
 * insertion order and behaves the same for already-sorted input, while also
 * doing the right thing if two runs of the same company are ever separated.
 */
function groupByCompany(experiences: Experience[]): [string, Experience[]][] {
  const groups = new Map<string, Experience[]>();
  for (const experience of experiences) {
    const existing = groups.get(experience.company);
    if (existing) existing.push(experience);
    else groups.set(experience.company, [experience]);
  }
  return [...groups.entries()];
}

