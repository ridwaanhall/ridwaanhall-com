import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld";
import { StatusChip, type AvailabilityKey } from "@/components/layout/status-badges";
import { RichText } from "@/components/site/rich-text";
import {
  AwardCard,
  CertificationCard,
  EducationCard,
  ExperienceCard,
} from "@/components/site/about-cards";
import { AboutTabs } from "@/components/site/about-tabs";
import { ApplicationCard } from "@/components/site/application-card";
import { PagedCards } from "@/components/site/paged-cards";
import { CvDownload } from "@/components/site/cv-download";
import { LinkedInCertifications } from "@/components/site/linkedin-certifications";
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
import { PAGE_GUTTER } from "@/lib/ui/shapes";
import { PageHeader } from "@/components/site/ui/page-header";
// Stories are author-written HTML fragments; same allow-list as the blog body.

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
          <LinkedInCertifications username={about.username} count={certifications.length} />
          {/* The banner stays outside the pager: it counts the whole list and
              belongs to the tab, not to the page of cards under it. */}
          <PagedCards
            className="space-y-3 sm:space-y-4"
            cards={certifications.map((certification) => (
              <CertificationCard key={certification.id} certification={certification} />
            ))}
          />
        </div>
      ),
    },
    {
      id: "applications",
      label: "Applications",
      content: (
        <div className="mt-4">
          {applications.length > 0 ? (
            <PagedCards
              cards={applications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            />
          ) : (
            <p className="text-zinc-400">No applications found.</p>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <JsonLdScript schemas={await aboutSchemas(about)} />
      <main className={PAGE_GUTTER}>
        <div>
          <PageHeader
            title="About Me"
            lead={
              <>
                Built on belief and shaped through code. This is the path I&rsquo;ve taken, and
                the trace I continue leaving.
              </>
            }
          />

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
  /*
   * Which flags are live. The wording and the hover colour come from
   * `AVAILABILITY`, shared with the navbar, the drawer and the home hero.
   */
  const flags = [
    about.is_open_to_work && "open",
    about.is_hiring && "hiring",
    about.is_sick && "sick",
  ].filter(Boolean) as AvailabilityKey[];

  return (
    <div className="mt-4 sm:mt-6">
      <CvDownload />

      <div className="space-y-3 sm:space-y-4">
        <div className="border border-zinc-700 rounded-xl p-4">
          {/*
            `flex-wrap` on both rows, which the original had on neither. With
            all three flags set the badges are 258px of content next to a 148px
            heading, so at 375px the third one started 24px *past* the right
            edge of the viewport and the whole page scrolled sideways. Above
            `sm` there is room for one line and nothing moves, so this only
            ever takes effect where the original was broken.
          */}
          <div className="flex flex-wrap items-center justify-between gap-y-2 mb-2 sm:mb-3">
            <p className="text-lg sm:text-xl font-medium">Assalamu&apos;alaikum</p>
            {/*
              Sized to match the mobile drawer's badges rather than carrying a
              second, larger scale for the same three flags. Both labels are
              rendered and one is hidden per width: the short one below `sm`,
              where "Under the Weather" beside a heading is what used to push a
              375px page sideways.
            */}
            <div className="flex flex-wrap gap-1.5">
              {flags.map((flag) => (
                <span key={flag}>
                  <StatusChip flag={flag} short className="px-2 py-0.5 text-xs sm:hidden" />
                  <StatusChip flag={flag} className="px-2 py-0.5 text-xs hidden sm:inline-flex" />
                </span>
              ))}
            </div>
          </div>

          {/*
            The letter, as rich text.
            
            It is one HTML body rather than an array of paragraph strings,
            so the admin edits it the way it edits a blog post. `prose-stories`
            keeps this block on the page's own typography rather than the
            article scale `.prose-content` sets -- see styles/prose.css. The
            markup that reaches the browser is identical either way.
          */}
          <RichText html={about.stories_html} className="prose-stories" />

          <p className="text-lg sm:text-xl font-medium mt-3 sm:mt-3">
            Wassalamu&apos;alaikum
          </p>
        </div>

        <SponsorMe sponsorUrl={sponsorUrl} />
      </div>
    </div>
  );
}

/**
 * Group roles by company, preserving the order they arrive in.
 *
 * Somebody with three roles at one employer should read as one entry with three
 * roles, not as the same company printed three times.
 *
 * A Map rather than grouping consecutive runs: it preserves insertion order, so
 * already-sorted input comes out in the order the sort chose, and it still does
 * the right thing if two runs of the same company are ever separated.
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

