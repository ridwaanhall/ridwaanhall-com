import type { Metadata } from "next";

import {H3, META } from "@/components/foothill/classes";
import { Icon } from "@/components/foothill/icons";
import { MAIN, WRAP } from "@/components/foothill/layout";
import { Animate, CountUp, PageMotion, Reveal } from "@/components/foothill/motion";
import { Portrait } from "@/components/foothill/portrait";
import { monthYearLabel } from "@/components/foothill/rows";
import { SectionIndex } from "@/components/foothill/section-index";
import { ShowMore } from "@/components/foothill/show-more";
import { ActionLink, Fact, Heading, Logo, PageHead } from "@/components/foothill/ui";
import { JsonLdScript } from "@/components/seo/json-ld";
import { RichText } from "@/components/site/rich-text";
import type { Application, Certification, Education, Experience } from "@/lib/data/about";
import {
  getAboutData,
  getApplications,
  getAwards,
  getCertifications,
  getEducation,
  getExperiences,
  getSkillsByCategory,
} from "@/lib/data/about";
import { aboutSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { aboutSchemas } from "@/lib/seo/schemas-for-page";
import { bareUrl, groupBy } from "@/lib/site/display";
import { cn } from "@/lib/utils/cn";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutData();
  if (!about) return {};
  return buildMetadata(aboutSeo(about), about);
}

const SECTIONS = [
  { id: "story", label: "Story" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "recognition", label: "Recognition" },
  { id: "certifications", label: "Certifications" },
  { id: "job-hunt", label: "The job hunt" },
];

/** A section's title, with how many entries sit under it. */
function Title({ id, children, count }: { id: string; children: string; count?: number }) {
  return (
    <Heading id={`${id}-title`} count={count}>
      {children}
    </Heading>
  );
}

/** The plus that turns into a cross while its `<details>` is open. */
function Toggle() {
  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-[transform,background-color] duration-500 group-open:rotate-45 group-open:bg-raise group-hover:border-ink"
    >
      <Icon name="plus" className="h-3.5 w-3.5" />
    </span>
  );
}

export default async function AboutPage() {
  const [about, experiences, education, awards, certifications, applications, skills] =
    await Promise.all([
      getAboutData(),
      getExperiences(),
      getEducation(),
      getAwards(),
      getCertifications(),
      getApplications(),
      getSkillsByCategory(),
    ]);
  if (!about) return null;

  const sections = SECTIONS.filter(({ id }) => {
    if (id === "experience") return experiences.length > 0;
    if (id === "education") return education.length > 0;
    if (id === "skills") return Object.keys(skills).length > 0;
    if (id === "recognition") return awards.length > 0;
    if (id === "certifications") return certifications.length > 0;
    if (id === "job-hunt") return applications.length > 0;
    return true;
  });

  return (
    <main className={MAIN}>
      <JsonLdScript schemas={await aboutSchemas(about)} />
      <div className={WRAP}>
        <PageHead
          title={
            <>
              {about.first_name || about.name}, known online as{" "}
              <span className="text-mute">{about.username}</span>.
            </>
          }
          lead={about.long_description.split(". ").slice(0, 2).join(". ") + "."}
        />

        <div className="mt-20 grid gap-14 lg:grid-cols-12 lg:gap-10">
          <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-28">
              <SectionIndex sections={sections} />
              <CvLinks cv={about.cv} className="mt-10" />
            </div>
          </aside>

          <div className="min-w-0 space-y-32 lg:col-span-9">
            <section id="story" aria-labelledby="story-title" className="scroll-mt-28">
              <h2 id="story-title" className="sr-only">
                Story
              </h2>
              <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_15rem]">
                <Reveal>
                  <RichText html={about.stories_html} className="fh-prose fh-prose-lead" />
                </Reveal>
                <div className="md:col-start-2 md:row-start-1">
                  {about.image_url && (
                    <Portrait
                      src={about.image_url}
                      alt={`${about.name}, drawn in horizontal lines`}
                      className="w-48 md:w-full"
                    />
                  )}
                  <dl className="mt-6 border-t border-line">
                    <Fact label="Based in">
                      {[about.location.residency || about.location.regency, about.location.province]
                        .filter(Boolean)
                        .join(", ")}
                    </Fact>
                    {about.aka && <Fact label="Also">{about.aka}</Fact>}
                    {about.personal_website && (
                      <Fact label="Site">
                        <a href={about.personal_website} className="fh-link">
                          {bareUrl(about.personal_website)}
                        </a>
                      </Fact>
                    )}
                  </dl>
                </div>
              </div>
              <CvLinks cv={about.cv} className="mt-12 lg:hidden" />
            </section>

            {experiences.length > 0 && (
              <section id="experience" aria-labelledby="experience-title" className="scroll-mt-28">
                <Title id="experience" count={experiences.length}>
                  Where I have worked
                </Title>
                <ol className="mt-12 space-y-14">
                  {groupBy(experiences, (role) => role.company).map(([company, roles]) => (
                    <ExperienceGroup key={company} company={company} roles={roles} />
                  ))}
                </ol>
              </section>
            )}

            {education.length > 0 && (
              <section id="education" aria-labelledby="education-title" className="scroll-mt-28">
                <Title id="education">Where I studied</Title>
                <Reveal as="ol" stagger className="mt-12 space-y-10">
                  {education.map((item) => (
                    <EducationRow key={`${item.institution}-${item.degree}`} item={item} />
                  ))}
                </Reveal>
              </section>
            )}

            {Object.keys(skills).length > 0 && (
              <section id="skills" aria-labelledby="skills-title" className="scroll-mt-28">
                <Title id="skills" count={Object.values(skills).reduce((sum, list) => sum + list.length, 0)}>
                  What I work with
                </Title>
                <Reveal as="dl" stagger className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2">
                  {Object.entries(skills).map(([category, list]) => (
                    <div key={category}>
                      <dt className="text-[14px] text-mute">{category}</dt>
                      <dd className="mt-2 text-[17px] leading-relaxed text-ink">
                        {list.map((skill) => skill.name).join(", ")}
                      </dd>
                    </div>
                  ))}
                </Reveal>
              </section>
            )}

            {awards.length > 0 && (
              <section id="recognition" aria-labelledby="recognition-title" className="scroll-mt-28">
                <Title id="recognition" count={awards.length}>
                  Recognition
                </Title>
                <Reveal as="ol" stagger className="mt-12 space-y-10">
                  {awards.map((award) => (
                    <li key={award.id} className="group flex gap-5">
                      <Logo src={award.logo} name={award.institution} />
                      <div className="min-w-0">
                        <p className={H3}>
                          {award.credential_url ? (
                            <a href={award.credential_url} target="_blank" rel="noopener noreferrer" className="fh-underline">
                              {award.title}
                            </a>
                          ) : (
                            award.title
                          )}
                        </p>
                        <p className={`${META} mt-2`}>
                          {award.institution}, {monthYearLabel(award.issued)}
                        </p>
                        {award.description && award.description !== award.title && (
                          <p className="mt-3 max-w-[62ch] text-[16px] leading-relaxed text-mute">{award.description}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </Reveal>
              </section>
            )}

            {certifications.length > 0 && (
              <section id="certifications" aria-labelledby="certifications-title" className="scroll-mt-28">
                <div className="flex flex-wrap items-end justify-between gap-6">
                  <Title id="certifications" count={certifications.length}>
                    Certifications
                  </Title>
                  <ActionLink href={`https://www.linkedin.com/in/${about.username}/details/certifications/`}>
                    All of them on LinkedIn
                  </ActionLink>
                </div>
                <Certifications items={certifications} />
              </section>
            )}

            {applications.length > 0 && (
              <section id="job-hunt" aria-labelledby="job-hunt-title" className="scroll-mt-28">
                <Title id="job-hunt" count={applications.length}>
                  The job hunt, in public
                </Title>
                <JobHunt applications={applications} />
              </section>
            )}
          </div>
        </div>
      </div>
      <PageMotion />
    </main>
  );
}

function CvLinks({ cv, className }: { cv: { main: string; latest: string; copy: string }; className?: string }) {
  const links = [
    { href: "/cv", label: "Read the CV", show: cv.main },
    { href: "/cv-latest", label: "The latest edit", show: cv.latest },
    { href: "/cv-copy", label: "Make a copy", show: cv.copy },
  ].filter((link) => link.show);
  if (!links.length) return null;
  return (
    <div className={className}>
      <p className="text-[14px] font-medium text-ink">Résumé</p>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            {/* External: these are redirects to documents, not pages. */}
            <ActionLink href={link.href} external icon="doc" className="text-[15px] text-mute hover:text-ink">
              {link.label}
            </ActionLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function periodLabel(role: Experience): string {
  const start = monthYearLabel(role.period.start);
  const end = role.period.end === "Present" ? "now" : monthYearLabel(role.period.end);
  return start === end ? start : `${start} to ${end}`;
}

function ExperienceGroup({ company, roles }: { company: string; roles: Experience[] }) {
  const website = roles.find((role) => role.website)?.website;
  const logo = roles.find((role) => role.logo)?.logo ?? "";
  return (
    <Reveal as="li" className="group grid gap-6 md:grid-cols-[3.5rem_minmax(0,1fr)]">
      <Logo src={logo} name={company} className="h-14 w-14 rounded-[14px]" />
      <div className="min-w-0">
        <p className="font-display text-[clamp(1.5rem,1.25rem+1vw,2rem)] leading-tight font-medium tracking-[-0.025em] text-ink">
          {website ? (
            <a href={website} target="_blank" rel="noopener noreferrer" className="fh-underline">
              {company}
            </a>
          ) : (
            company
          )}
        </p>
        {roles.length > 1 && <p className={`${META} mt-1`}>{roles.length} roles</p>}
        <ol className="mt-6 space-y-7 border-l border-line pl-6">
          {roles.map((role) => (
            <li key={role.id} className="relative">
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-[0.55em] -left-[29px] h-[9px] w-[9px] rounded-full border-2 border-paper",
                  role.is_current ? "bg-sulfur-mark" : "bg-line",
                )}
              />
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <p className="text-[18px] font-medium text-ink">
                  {role.title}
                  {role.is_current && (
                    <span className="ml-3 rounded-full bg-raise px-2 py-0.5 align-middle text-[12px] font-normal text-ink">
                      Current
                    </span>
                  )}
                </p>
                <p className={META}>{periodLabel(role)}</p>
              </div>
              <p className={`${META} mt-1`}>
                {[role.employment_type, role.location_type, role.location].filter(Boolean).join(", ")}
              </p>
              {role.responsibilities.length > 0 && (
                <details className="group/role mt-3">
                  <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-[14px] font-medium text-ink [&::-webkit-details-marker]:hidden">
                    <Icon name="plus" className="h-3.5 w-3.5 transition-transform duration-500 group-open/role:rotate-45" />
                    What I did
                  </summary>
                  <ul className="mt-3 max-w-[64ch] space-y-2 text-[16px] leading-relaxed text-mute">
                    {role.responsibilities.map((task) => (
                      <li key={task} className="relative pl-5 before:absolute before:top-[0.75em] before:left-0 before:h-px before:w-2.5 before:bg-mute">
                        {task}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          ))}
        </ol>
      </div>
    </Reveal>
  );
}

function EducationRow({ item }: { item: Education }) {
  const span =
    item.years ||
    (item.date ? [monthYearLabel(item.date.start), monthYearLabel(item.date.end)].filter(Boolean).join(" to ") : "");
  return (
    <li className="group flex gap-5">
      <Logo src={item.logo} name={item.institution} className="h-14 w-14 rounded-[14px]" />
      <div className="min-w-0">
        <p className={H3}>
          {item.website ? (
            <a href={item.website} target="_blank" rel="noopener noreferrer" className="fh-underline">
              {item.institution}
            </a>
          ) : (
            item.institution
          )}
        </p>
        <p className={`${META} mt-2`}>
          {item.degree}
          {item.alias && `, ${item.alias}`}
          {span && `, ${span}`}
        </p>
        {item.achievements.length > 0 && (
          <ul className="mt-3 max-w-[64ch] space-y-1.5 text-[16px] leading-relaxed text-mute">
            {item.achievements.map((line) => (
              <li key={line} className="relative pl-5 before:absolute before:top-[0.75em] before:left-0 before:h-px before:w-2.5 before:bg-mute">
                {line}
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

function Certifications({ items }: { items: Certification[] }) {
  const byYear = groupBy(items, (item) => item.issued?.year ?? 0);
  return (
    <div className="mt-12 border-b border-line">
      {byYear.map(([year, list], index) => (
        <details key={year} open={index === 0} className="group border-t border-line">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
            <span className="font-display text-[clamp(1.6rem,1.3rem+1.2vw,2.25rem)] font-medium tracking-[-0.03em] text-ink tabular-nums">
              {year || "Undated"}
            </span>
            <span className="flex items-center gap-4 text-[14px] text-mute">
              {list.length} {list.length === 1 ? "certificate" : "certificates"}
              <Toggle />
            </span>
          </summary>
          <ul className="grid gap-x-8 gap-y-5 pb-8 md:grid-cols-2">
            {list.map((cert) => (
              <li key={cert.id} className="group flex min-w-0 gap-4">
                <Logo src={cert.logo} name={cert.institution} className="h-9 w-9 rounded-[8px]" />
                <span className="min-w-0">
                  {cert.credential_url ? (
                    <a
                      href={cert.credential_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[16px] leading-snug text-ink"
                    >
                      <span className="fh-underline">{cert.title}</span>
                    </a>
                  ) : (
                    <span className="text-[16px] leading-snug text-ink">{cert.title}</span>
                  )}
                  <span className={`${META} mt-1 block`}>
                    {cert.institution}
                    {cert.issued && `, ${cert.issued.month.slice(0, 3)}`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}

/** Accepted first, then the two ways an application ends without one. */
const OUTCOME_ORDER = ["accepted", "rejected", "ghosted"];
const OUTCOME_TONE: Record<string, string> = {
  accepted: "bg-sulfur-mark",
  rejected: "bg-mute",
  ghosted: "bg-mute/35",
};

function JobHunt({ applications }: { applications: Application[] }) {
  const outcomes = groupBy(applications, (app) => app.status_slug || "unknown").sort(
    ([a], [b]) => rank(a) - rank(b),
  );
  const total = applications.length;

  return (
    <div className="mt-8">
      <Reveal as="p" className="max-w-[52ch] text-[19px] leading-relaxed text-mute">
        Every application, kept rather than tidied away: who, for what, how far it got, and what it
        taught me.
      </Reveal>

      <Animate className="mt-12">
        <dl className="grid grid-cols-3 gap-6">
          {outcomes.map(([slug, list]) => (
            <div key={slug}>
              <dt className="flex items-center gap-2 text-[14px] text-mute">
                <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", OUTCOME_TONE[slug] ?? "bg-mute")} />
                {label(slug, list)}
              </dt>
              <dd className="mt-2 font-display text-[clamp(2.25rem,1.6rem+2.6vw,3.75rem)] leading-none font-medium tracking-[-0.04em] text-ink">
                <CountUp value={list.length} />
                <span className="ml-2 font-text text-[15px] font-normal tracking-normal text-mute">
                  {Math.round((list.length / total) * 100)}%
                </span>
              </dd>
            </div>
          ))}
        </dl>
        <div
          className="mt-8 flex h-3 w-full gap-[3px] overflow-hidden rounded-full"
          role="img"
          aria-label={outcomes.map(([slug, list]) => `${list.length} ${label(slug, list)}`).join(", ")}
        >
          {outcomes.map(([slug, list]) => (
            <span
              key={slug}
              data-fh-bar
              className={cn("h-full first:rounded-l-full last:rounded-r-full", OUTCOME_TONE[slug] ?? "bg-mute")}
              style={{ width: `${(list.length / total) * 100}%` }}
            />
          ))}
        </div>
      </Animate>

      <ShowMore noun="applications" className="mt-14 border-b border-line">
        {applications.map((app) => (
          <ApplicationRow key={app.id} app={app} />
        ))}
      </ShowMore>
    </div>
  );
}

function rank(slug: string): number {
  const at = OUTCOME_ORDER.indexOf(slug);
  return at < 0 ? OUTCOME_ORDER.length : at;
}

function label(slug: string, list: Application[]): string {
  return list[0]?.status || slug;
}

function ApplicationRow({ app }: { app: Application }) {
  return (
    <details className="group border-t border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block truncate text-[17px] font-medium text-ink">{app.position}</span>
          <span className={`${META} mt-0.5 block truncate`}>
            {app.company_name}
            {app.location_type && `, ${app.location_type.toLowerCase()}`}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-4 text-[14px] text-mute">
          <span className="hidden items-center gap-2 sm:flex">
            <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", OUTCOME_TONE[app.status_slug] ?? "bg-mute")} />
            {app.status}
          </span>
          <Toggle />
        </span>
      </summary>
      <div className="grid gap-8 pb-8 md:grid-cols-[minmax(0,1fr)_15rem] md:gap-10">
        {app.journey.length > 0 ? (
          <ol className="relative ml-1 space-y-5 border-l border-line pl-6">
            {app.journey.map((step, index) => (
              <li key={index} className="relative">
                <span aria-hidden="true" className="absolute top-[0.5em] -left-[29.5px] h-[9px] w-[9px] rounded-full border-2 border-paper bg-mute" />
                <p className="text-[16px] font-medium text-ink">{step.title}</p>
                {step.timestamp && (
                  <p className={`${META} mt-0.5`}>
                    {step.timestamp.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                  </p>
                )}
                {step.details && <p className="mt-1.5 text-[15px] leading-relaxed text-mute">{step.details}</p>}
                {step.notes && <p className="mt-1.5 text-[15px] leading-relaxed text-mute">{step.notes}</p>}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-[15px] text-mute">No steps were recorded for this one.</p>
        )}
        <dl className="border-t border-line text-[14px]">
          {[
            ["Status", app.status],
            ["Type", app.employment_type],
            ["Where", app.location],
            ["Via", app.applied_via],
            ["Salary", app.salary_range],
          ]
            .filter(([, value]) => value)
            .map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4 border-b border-line py-2.5">
                <dt className="text-mute">{key}</dt>
                <dd className="text-right text-ink">{value}</dd>
              </div>
            ))}
        </dl>
        {app.lessons_learned && (
          <blockquote className="border-l-2 border-sulfur-mark pl-5 text-[18px] leading-relaxed text-ink md:col-span-2">
            {app.lessons_learned}
          </blockquote>
        )}
      </div>
    </details>
  );
}
