import type { Metadata } from "next";
import Image from "next/image";

import { EYEBROW } from "@/components/foothill/classes";
import { MAIN, WRAP } from "@/components/foothill/layout";
import { PageMotion } from "@/components/foothill/page-motion";
import { Reveal } from "@/components/foothill/reveal";
import { monthYearLabel } from "@/components/foothill/rows";
import { SectionIndex } from "@/components/foothill/section-index";
import { ShowMore } from "@/components/foothill/show-more";
import { Arrow, Fact, PageHead } from "@/components/foothill/ui";
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
          eyebrow="About"
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

          <div className="min-w-0 space-y-28 lg:col-span-9">
            <section id="story" aria-labelledby="story-title" className="scroll-mt-28">
              <h2 id="story-title" className={EYEBROW}>
                Story
              </h2>
              <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,1fr)_14rem]">
                <RichText html={about.stories_html} className="fh-prose fh-prose-lead" />
                <div className="md:order-first md:col-start-2 md:row-start-1">
                  {about.image_url && (
                    <div className="relative aspect-[4/5] w-40 overflow-hidden rounded-md bg-raise md:w-full">
                      <Image
                        src={about.image_url}
                        alt={`${about.name}, a portrait`}
                        fill
                        sizes="(min-width: 768px) 224px, 160px"
                        className="object-cover grayscale-[0.2]"
                        priority
                      />
                    </div>
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
                <h2 id="experience-title" className={EYEBROW}>
                  Experience <span className="ml-2 text-ink">{experiences.length}</span>
                </h2>
                <ol className="mt-8 border-b border-line">
                  {groupBy(experiences, (role) => role.company).map(([company, roles]) => (
                    <ExperienceGroup key={company} company={company} roles={roles} />
                  ))}
                </ol>
              </section>
            )}

            {education.length > 0 && (
              <section id="education" aria-labelledby="education-title" className="scroll-mt-28">
                <h2 id="education-title" className={EYEBROW}>
                  Education
                </h2>
                <Reveal as="ol" stagger className="mt-8 border-b border-line">
                  {education.map((item) => (
                    <EducationRow key={`${item.institution}-${item.degree}`} item={item} />
                  ))}
                </Reveal>
              </section>
            )}

            {Object.keys(skills).length > 0 && (
              <section id="skills" aria-labelledby="skills-title" className="scroll-mt-28">
                <h2 id="skills-title" className={EYEBROW}>
                  Skills{" "}
                  <span className="ml-2 text-ink">
                    {Object.values(skills).reduce((sum, list) => sum + list.length, 0)}
                  </span>
                </h2>
                <Reveal as="dl" className="mt-8 grid gap-x-10 border-t border-line md:grid-cols-2">
                  {Object.entries(skills).map(([category, list]) => (
                    <div key={category} className="border-b border-line py-4">
                      <dt className="text-[13px] text-mute">{category}</dt>
                      <dd className="mt-1.5 text-[16px] leading-relaxed text-ink">
                        {list.map((skill) => skill.name).join(", ")}
                      </dd>
                    </div>
                  ))}
                </Reveal>
              </section>
            )}

            {awards.length > 0 && (
              <section id="recognition" aria-labelledby="recognition-title" className="scroll-mt-28">
                <h2 id="recognition-title" className={EYEBROW}>
                  Recognition <span className="ml-2 text-ink">{awards.length}</span>
                </h2>
                <Reveal as="ol" stagger className="mt-8 border-b border-line">
                  {awards.map((award) => (
                    <li
                      key={award.id}
                      className="grid gap-y-1.5 border-t border-line py-5 md:grid-cols-[7rem_minmax(0,1fr)] md:gap-x-8"
                    >
                      <span className="fh-mono text-[12px] text-mute">{monthYearLabel(award.issued)}</span>
                      <div>
                        <p className="text-[18px] leading-snug text-ink">
                          {award.credential_url ? (
                            <a href={award.credential_url} target="_blank" rel="noopener noreferrer" className="fh-link">
                              {award.title}
                            </a>
                          ) : (
                            award.title
                          )}
                        </p>
                        <p className="mt-1 text-[14px] text-mute">{award.institution}</p>
                        {award.description && award.description !== award.title && (
                          <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-mute">
                            {award.description}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </Reveal>
              </section>
            )}

            {certifications.length > 0 && (
              <section id="certifications" aria-labelledby="certifications-title" className="scroll-mt-28">
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <h2 id="certifications-title" className={EYEBROW}>
                    Certifications <span className="ml-2 text-ink">{certifications.length}</span>
                  </h2>
                  <a
                    href={`https://www.linkedin.com/in/${about.username}/details/certifications/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group text-[14px] text-mute transition-colors hover:text-ink"
                  >
                    All of them on LinkedIn <Arrow diagonal />
                  </a>
                </div>
                <Certifications items={certifications} />
              </section>
            )}

            {applications.length > 0 && (
              <section id="job-hunt" aria-labelledby="job-hunt-title" className="scroll-mt-28">
                <h2 id="job-hunt-title" className={EYEBROW}>
                  The job hunt, in public <span className="ml-2 text-ink">{applications.length}</span>
                </h2>
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
    { href: "/cv", label: "CV", show: cv.main },
    { href: "/cv-latest", label: "Latest CV", show: cv.latest },
    { href: "/cv-copy", label: "Copy the CV", show: cv.copy },
  ].filter((link) => link.show);
  if (!links.length) return null;
  return (
    <div className={className}>
      <p className={EYEBROW}>Résumé</p>
      <ul className="mt-3 space-y-1.5">
        {links.map((link) => (
          <li key={link.href}>
            {/* Plain anchors: these are redirects to documents, not pages. */}
            <a href={link.href} target="_blank" rel="noopener noreferrer" className="group text-[14px] text-ink">
              <span className="fh-link">{link.label}</span> <Arrow diagonal className="text-mute" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function periodLabel(role: Experience): string {
  const start = monthYearLabel(role.period.start);
  const end = role.period.end === "Present" ? "now" : monthYearLabel(role.period.end);
  return start === end ? start : `${start} – ${end}`;
}

function ExperienceGroup({ company, roles }: { company: string; roles: Experience[] }) {
  const website = roles.find((role) => role.website)?.website;
  return (
    <Reveal as="li" className="grid gap-y-4 border-t border-line py-7 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-x-8">
      <div>
        <p className="text-[17px] font-medium text-ink">
          {website ? (
            <a href={website} target="_blank" rel="noopener noreferrer" className="fh-link">
              {company}
            </a>
          ) : (
            company
          )}
        </p>
        {roles.length > 1 && <p className="fh-mono mt-1 text-[11px] text-mute">{roles.length} roles</p>}
      </div>
      <ol className="space-y-6">
        {roles.map((role) => (
          <li key={role.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <p className="text-[17px] text-ink">
                {role.title}
                {role.is_current && (
                  <span className="fh-mono ml-3 text-[10px] tracking-[0.14em] text-sulfur uppercase">Current</span>
                )}
              </p>
              <p className="fh-mono text-[12px] text-mute">{periodLabel(role)}</p>
            </div>
            <p className="mt-1 text-[14px] text-mute">
              {[role.employment_type, role.location_type, role.location].filter(Boolean).join(" · ")}
            </p>
            {role.responsibilities.length > 0 && (
              <details className="group mt-3">
                <summary className="fh-mono inline-flex cursor-pointer list-none items-center gap-2 text-[11px] tracking-[0.1em] text-mute uppercase hover:text-ink [&::-webkit-details-marker]:hidden">
                  <span className="inline-block transition-transform group-open:rotate-45">+</span>
                  What I did
                </summary>
                <ul className="mt-3 max-w-[64ch] space-y-2 text-[15px] leading-relaxed text-mute">
                  {role.responsibilities.map((task) => (
                    <li key={task} className="relative pl-5 before:absolute before:top-[0.7em] before:left-0 before:h-px before:w-2.5 before:bg-line">
                      {task}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </li>
        ))}
      </ol>
    </Reveal>
  );
}

function EducationRow({ item }: { item: Education }) {
  const span =
    item.years ||
    (item.date ? [monthYearLabel(item.date.start), monthYearLabel(item.date.end)].filter(Boolean).join(" – ") : "");
  return (
    <li className="grid gap-y-1.5 border-t border-line py-5 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-x-8">
      <p className="fh-mono text-[12px] text-mute">{span}</p>
      <div>
        <p className="text-[17px] text-ink">{item.institution}</p>
        <p className="mt-1 text-[14px] text-mute">
          {item.degree}
          {item.alias && ` · ${item.alias}`}
        </p>
        {item.achievements.length > 0 && (
          <ul className="mt-3 max-w-[64ch] space-y-1.5 text-[15px] leading-relaxed text-mute">
            {item.achievements.map((line) => (
              <li key={line} className="relative pl-5 before:absolute before:top-[0.7em] before:left-0 before:h-px before:w-2.5 before:bg-line">
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
    <div className="mt-8 border-b border-line">
      {byYear.map(([year, list], index) => (
        <details key={year} open={index === 0} className="group border-t border-line">
          <summary className="flex cursor-pointer list-none items-baseline justify-between py-4 [&::-webkit-details-marker]:hidden">
            <span className="text-[22px] font-medium tracking-[-0.02em] text-ink tabular-nums">
              {year || "Undated"}
            </span>
            <span className="fh-mono text-[12px] text-mute">
              {list.length} <span className="ml-2 inline-block transition-transform group-open:rotate-45">+</span>
            </span>
          </summary>
          <ul className="pb-4">
            {list.map((cert) => (
              <li
                key={cert.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 border-t border-line/60 py-2.5 text-[15px]"
              >
                <span className="min-w-0">
                  {cert.credential_url ? (
                    <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="fh-link text-ink">
                      {cert.title}
                    </a>
                  ) : (
                    <span className="text-ink">{cert.title}</span>
                  )}
                  <span className="text-mute"> — {cert.institution}</span>
                </span>
                <span className="fh-mono text-[11px] text-mute">{cert.issued?.month.slice(0, 3)}</span>
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
  ghosted: "bg-line",
};

function JobHunt({ applications }: { applications: Application[] }) {
  const outcomes = groupBy(applications, (app) => app.status_slug || "unknown").sort(
    ([a], [b]) => rank(a) - rank(b),
  );
  const total = applications.length;

  return (
    <div className="mt-8">
      <p className="fh-serif max-w-[52ch] text-[20px] leading-[1.45] text-ink">
        Every application, kept rather than tidied away: who, for what, how far it got, and what it
        taught me.
      </p>

      <Reveal as="div" className="mt-8">
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-raise" role="img" aria-label={outcomes.map(([slug, list]) => `${list.length} ${label(slug, list)}`).join(", ")}>
          {outcomes.map(([slug, list]) => (
            <span
              key={slug}
              className={cn("h-full", OUTCOME_TONE[slug] ?? "bg-mute")}
              style={{ width: `${(list.length / total) * 100}%` }}
            />
          ))}
        </div>
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
          {outcomes.map(([slug, list]) => (
            <div key={slug} className="flex items-baseline gap-2">
              <span aria-hidden="true" className={cn("h-2 w-2 translate-y-[-1px] rounded-full", OUTCOME_TONE[slug] ?? "bg-mute")} />
              <dt className="text-[14px] text-mute">{label(slug, list)}</dt>
              <dd className="fh-mono text-[13px] text-ink tabular-nums">
                {list.length} <span className="text-mute">({Math.round((list.length / total) * 100)}%)</span>
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>

      <ShowMore noun="applications" className="mt-10 border-b border-line">
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
      <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-1 py-4 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block truncate text-[16px] text-ink">{app.position}</span>
          <span className="block truncate text-[14px] text-mute">
            {app.company_name}
            {app.location_type && ` · ${app.location_type}`}
          </span>
        </span>
        <span className="fh-mono flex items-center gap-2 text-[11px] tracking-[0.08em] text-mute uppercase">
          <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", OUTCOME_TONE[app.status_slug] ?? "bg-mute")} />
          {app.status}
          <span className="ml-1 inline-block transition-transform group-open:rotate-45">+</span>
        </span>
      </summary>
      <div className="grid gap-6 pb-6 md:grid-cols-[minmax(0,1fr)_14rem] md:gap-10">
        {app.journey.length > 0 ? (
          <ol className="relative ml-1 space-y-4 border-l border-line pl-5">
            {app.journey.map((step, index) => (
              <li key={index} className="relative">
                <span aria-hidden="true" className="absolute top-[0.55em] -left-[24.5px] h-2 w-2 rounded-full border border-mute bg-paper" />
                <p className="text-[15px] text-ink">{step.title}</p>
                {step.timestamp && (
                  <p className="fh-mono mt-0.5 text-[11px] text-mute">
                    {step.timestamp.toISOString().slice(0, 10)}
                  </p>
                )}
                {step.details && <p className="mt-1 text-[14px] leading-relaxed text-mute">{step.details}</p>}
                {step.notes && <p className="mt-1 text-[14px] leading-relaxed text-mute italic">{step.notes}</p>}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-[14px] text-mute">No steps were recorded for this one.</p>
        )}
        <dl className="border-t border-line text-[14px]">
          {[
            ["Type", app.employment_type],
            ["Where", app.location],
            ["Via", app.applied_via],
            ["Salary", app.salary_range],
          ]
            .filter(([, value]) => value)
            .map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4 border-b border-line py-2">
                <dt className="text-mute">{key}</dt>
                <dd className="text-right text-ink">{value}</dd>
              </div>
            ))}
        </dl>
        {app.lessons_learned && (
          <p className="fh-serif text-[17px] leading-relaxed text-ink italic md:col-span-2">
            &ldquo;{app.lessons_learned}&rdquo;
          </p>
        )}
      </div>
    </details>
  );
}
