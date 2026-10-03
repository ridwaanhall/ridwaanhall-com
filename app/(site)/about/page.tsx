import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld";
import { AVAILABILITY, type AvailabilityKey } from "@/components/layout/status-badges";
import { Reveal, SplitHeading } from "@/components/motion/reveal";
import { ScrambleIn } from "@/components/motion/scramble";
import { SectionIndex } from "@/components/motion/section-index";
import {
  ApplicationEntry,
  AwardEntry,
  CertificationEntry,
  EducationEntry,
  ExperienceEntry,
  Timeline,
} from "@/components/site/about-entries";
import { CvDownload } from "@/components/site/cv-download";
import { PagedCards } from "@/components/site/paged-cards";
import { RichText } from "@/components/site/rich-text";
import { SponsorMe } from "@/components/site/sponsor-me";
import { ArrowLink, CONTAINER, PageHeader, StatusDot } from "@/components/site/ui";
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

  /*
   * One page with an index rather than six tabs. Each tab used to hide five
   * sixths of the page behind a click; laid end to end, the reader scrolls
   * and the index says where they are. The ids are the tab ids they replace.
   */
  const sections = [
    { id: "intro", label: "Intro", show: true },
    { id: "experiences", label: "Experiences", show: experiences.length > 0 },
    { id: "education", label: "Education", show: education.length > 0 },
    { id: "awards", label: "Awards", show: awards.length > 0 },
    { id: "certifications", label: "Certifications", show: certifications.length > 0 },
    { id: "applications", label: "Applications", show: true },
  ].filter((section) => section.show);

  return (
    <>
      <JsonLdScript schemas={await aboutSchemas(about)} />
      <main className={CONTAINER}>
        <PageHeader
          title="About"
          lead={
            <>
              Built on belief and shaped through code. This is the path I&rsquo;ve taken, and the
              trace I continue leaving.
            </>
          }
        />

        <div className="grid gap-12 pt-4 lg:grid-cols-[11rem_1fr] lg:gap-16">
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <SectionIndex items={sections.map(({ id, label }) => ({ id, label }))} />
            </div>
          </aside>

          <div className="min-w-0 space-y-20">
            <AboutSection id="intro" title="Intro">
              <Intro about={about} />
            </AboutSection>

            {experiences.length > 0 && (
              <AboutSection
                id="experiences"
                title="Experiences"
                marker={`${groupByCompany(experiences).length} employers · ${experiences.length} roles`}
              >
                <Timeline>
                  {groupByCompany(experiences).map(([company, roles]) => (
                    <ExperienceEntry key={company} company={company} roles={roles} />
                  ))}
                </Timeline>
              </AboutSection>
            )}

            {education.length > 0 && (
              <AboutSection id="education" title="Education" marker={`${education.length} schools`}>
                <Timeline>
                  {education.map((item) => (
                    <EducationEntry key={`${item.degree}-${item.institution}`} education={item} />
                  ))}
                </Timeline>
              </AboutSection>
            )}

            {awards.length > 0 && (
              <AboutSection id="awards" title="Awards" marker={`${awards.length} awards`}>
                <Timeline>
                  {awards.map((award) => (
                    <AwardEntry key={award.id} award={award} />
                  ))}
                </Timeline>
              </AboutSection>
            )}

            {certifications.length > 0 && (
              <AboutSection
                id="certifications"
                title="Certifications"
                marker={`${certifications.length} of 115+`}
                aside={
                  <ArrowLink href={`https://linkedin.com/in/${about.username}/details/certifications/`}>
                    View All 115+ Certifications
                  </ArrowLink>
                }
              >
                <p className="mb-4 text-sm text-zinc-500">
                  Showing {certifications.length} here; the full record lives on LinkedIn.
                </p>
                <PagedCards
                  className=""
                  cards={certifications.map((certification) => (
                    <CertificationEntry key={certification.id} certification={certification} />
                  ))}
                />
              </AboutSection>
            )}

            <AboutSection
              id="applications"
              title="Applications"
              marker={applications.length > 0 ? `${applications.length} applications` : undefined}
            >
              {applications.length > 0 ? (
                <PagedCards
                  className=""
                  cards={applications.map((application) => (
                    <ApplicationEntry key={application.id} application={application} />
                  ))}
                />
              ) : (
                <p className="text-zinc-400">No applications found.</p>
              )}
            </AboutSection>

            <SponsorMe sponsorUrl={sponsorUrl} />
          </div>
        </div>
      </main>
    </>
  );
}

/**
 * A section of the page: a mono marker counting what it holds, the heading,
 * and an optional link level with it. The same shape `Section` draws on every
 * other page, without its vertical padding -- here the column's own spacing
 * does that job, and the index beside it needs the headings to start where
 * the section does.
 */
function AboutSection({
  id,
  title,
  marker,
  aside,
  children,
}: {
  id: string;
  title: string;
  marker?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {marker && (
            <Reveal className="mb-3">
              <ScrambleIn className="type-meta text-zinc-500">{marker}</ScrambleIn>
            </Reveal>
          )}
          <SplitHeading as="h2" className="type-section text-zinc-100">
            {title}
          </SplitHeading>
        </div>
        {aside && <Reveal className="pb-1">{aside}</Reveal>}
      </div>
      {children}
    </section>
  );
}

function Intro({ about }: { about: AboutData }) {
  /*
   * Every flag that is set, short label below `sm` -- "Under the Weather"
   * beside a heading is what used to push a 375px page sideways.
   */
  const flags = [
    about.is_open_to_work && "open",
    about.is_hiring && "hiring",
    about.is_sick && "sick",
  ].filter(Boolean) as AvailabilityKey[];

  return (
    <div>
      {flags.length > 0 && (
        <Reveal className="type-meta mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-zinc-400">
          {flags.map((flag) => (
            <span key={flag} className="inline-flex items-center gap-2" title={flag === "sick" ? AVAILABILITY.sick.title : undefined}>
              {flag === "sick" ? (
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-zinc-500" />
              ) : (
                <StatusDot />
              )}
              <span className="sm:hidden">{AVAILABILITY[flag].short}</span>
              <span className="hidden sm:inline">{AVAILABILITY[flag].label}</span>
            </span>
          ))}
        </Reveal>
      )}

      <Reveal>
        <p className="font-serif text-xl font-[420] text-zinc-100 italic">Assalamu&apos;alaikum</p>
        {/*
          The letter, as rich text: one HTML body the admin edits the way it
          edits a blog post. `prose-stories` keeps it on this column's type
          rather than the article scale -- see styles/prose.css.
        */}
        <RichText
          html={about.stories_html}
          className="prose-stories mt-5 text-lg leading-relaxed text-zinc-300"
        />
        <p className="mt-6 font-serif text-xl font-[420] text-zinc-100 italic">Wassalamu&apos;alaikum</p>
      </Reveal>

      <CvDownload />
    </div>
  );
}

function groupByCompany(experiences: Experience[]): [string, Experience[]][] {
  const groups = new Map<string, Experience[]>();
  for (const experience of experiences) {
    const existing = groups.get(experience.company);
    if (existing) existing.push(experience);
    else groups.set(experience.company, [experience]);
  }
  return [...groups.entries()];
}

