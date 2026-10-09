import type { Metadata } from "next";
import Image from "next/image";

import { Certifications, JobHunt, SkillGroups, type ApplicationView, type CertView } from "@/components/foothill/about";
import { Disclosure } from "@/components/foothill/controls";
import { CvButton, CvThumb, CvTocAction } from "@/components/foothill/cv";
import { Icon } from "@/components/foothill/icons";
import { MAIN } from "@/components/foothill/layout";
import { PageMotion } from "@/components/foothill/motion";
import { monthYearLabel, projectView } from "@/components/foothill/rows";
import { SectionIndex } from "@/components/foothill/section-index";
import { Button, Empty, Facts, Heading, Logo, PageHead, Tag, TextLink } from "@/components/foothill/ui";
import { JsonLdScript } from "@/components/seo/json-ld";
import { RichText } from "@/components/site/rich-text";
import type { Application, Certification, Experience, Membership } from "@/lib/data/about";
import {
  getAboutData,
  getApplications,
  getAwards,
  getCertifications,
  getEducation,
  getExperiences,
  getMemberships,
  getSkillsByCategory,
} from "@/lib/data/about";
import { getProjects } from "@/lib/data/content";
import { aboutSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { aboutSchemas } from "@/lib/seo/schemas-for-page";
import { CV_FILE } from "@/lib/site/cv";
import { htmlToText } from "@/lib/markdown/html";
import { groupBy } from "@/lib/site/display";
import { skillIcon } from "@/lib/site/skills";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutData();
  if (!about) return {};
  return buildMetadata(aboutSeo(about), about);
}

const SECTIONS = [
  { id: "story", label: "Story" },
  { id: "cv", label: "CV" },
  { id: "experience", label: "Experience" },
  { id: "organizations", label: "Organizations" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "recognition", label: "Recognition" },
  { id: "certifications", label: "Certifications" },
  { id: "job-hunt", label: "The job hunt" },
];

function periodLabel(role: Pick<Experience | Membership, "period">): string {
  const start = monthYearLabel(role.period.start);
  const end = role.period.end === "Present" ? "now" : monthYearLabel(role.period.end);
  return start === end ? start : `${start} – ${end}`;
}

/** Stored lessons once carried coloured spans; what is read is the words. */
const plain = htmlToText;

const dated = (value: Date | null) =>
  value ? value.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" }) : "";

function certView(cert: Certification): CertView {
  return {
    id: cert.id,
    title: cert.title,
    issuer: cert.institution,
    logo: cert.logo,
    year: cert.issued?.year ?? null,
    month: cert.issued?.month.slice(0, 3) ?? "",
    url: cert.credential_url,
    featured: cert.is_featured,
    achievements: cert.achievements,
  };
}

function applicationView(app: Application): ApplicationView {
  const years = app.journey.flatMap((step) => (step.timestamp ? [step.timestamp.getUTCFullYear()] : []));
  return {
    id: app.id,
    year: years.length ? Math.min(...years) : null,
    position: app.position,
    company: app.company_name,
    logo: app.company_logo || null,
    status: app.status,
    slug: app.status_slug,
    mode: app.location_type,
    type: app.employment_type,
    where: app.location,
    via: app.applied_via ?? "",
    salary: app.salary_range ?? "",
    lessons: plain(app.lessons_learned),
    steps: app.journey.map((step) => ({ title: step.title, date: dated(step.timestamp), details: step.details, notes: step.notes })),
  };
}

export default async function AboutPage() {
  const [about, experiences, memberships, education, awards, certifications, applications, skills, projects] = await Promise.all([
    getAboutData(),
    getExperiences(),
    getMemberships(),
    getEducation(),
    getAwards(),
    getCertifications(),
    getApplications(),
    getSkillsByCategory(),
    getProjects(),
  ]);
  if (!about) return null;

  const companies = groupBy(experiences, (role) => role.company);
  const skillCount = Object.values(skills).flat().length;
  const years = new Set(certifications.map((cert) => cert.issued?.year ?? null)).size;
  const where = [about.location.residency || about.location.regency, about.location.province].filter(Boolean).join(", ");
  const cvLinks = (
    <>
      <span className="mono mute" style={{ padding: "0 12px" }}>
        CV
      </span>
      <CvTocAction />
      <a className="toc-act" href={CV_FILE} target="_blank" rel="noopener">
        <Icon name="out" size={14} />
        Open the PDF
      </a>
      {about.cv.latest && (
        <a className="toc-act" href={about.cv.latest} target="_blank" rel="noopener noreferrer">
          <Icon name="file" size={14} />
          Google Docs version
        </a>
      )}
    </>
  );

  return (
    <main className={MAIN}>
      <JsonLdScript schemas={await aboutSchemas(about)} />
      <div>
        <PageHead
          crumb={
            <div className="who-head" data-fh-enter="">
              {about.image_url ? (
                <figure className="ph">
                  <Image src={about.image_url} alt={about.image_alt || `${about.name}, drawn in horizontal lines`} width={76} height={76} priority />
                </figure>
              ) : (
                <span className="ph none" aria-hidden="true">
                  <Icon name="user" size={22} />
                </span>
              )}
              <div>
                <b>{about.name}</b>
                <span className="mono mute">
                  {where}
                  {about.aka && ` · ${about.aka}`}
                </span>
              </div>
            </div>
          }
          title={`Hi, I’m ${about.first_name || about.name}.`}
          lead={about.long_description}
          markdown="/about"
          facts={[
            ["Roles held", experiences.length],
            ["Skills", skillCount],
            ["Certifications", certifications.length],
            ["Awards", awards.length],
            ["Applications", applications.length],
          ]}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 28 }}>
            <CvButton />
            <Button ghost href="/contact" icon="pen">
              Write to me
            </Button>
          </div>
        </PageHead>

        <div className="wrap about" style={{ paddingBottom: 40 }}>
          <SectionIndex sections={SECTIONS}>{cvLinks}</SectionIndex>
          <div style={{ minWidth: 0 }}>
            <div className="resume-m">
              <CvButton sm />
              <a className="btn ghost sm" href={CV_FILE} target="_blank" rel="noopener">
                <Icon name="out" />
                Open the PDF
              </a>
            </div>

            <section id="story" className="sec" style={{ borderTop: 0, paddingTop: 0 }}>
              <Heading title="Story" note="In my own words." />
              <RichText html={about.stories_html} className="article" />
            </section>

            <section id="cv" className="sec">
              <Heading title="The CV, from this page" note="Generated from everything below, so it is never behind." />
              <div className="cv-sec">
                <CvThumb />
                <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
                  <p className="lead" style={{ maxWidth: "52ch" }}>
                    Two pages built from the roles, schools, skills, projects and awards on this page. When something here changes, the CV changes with it.
                  </p>
                  <ul className="bul" style={{ paddingBottom: 0 }}>
                    <li>Written for applicant tracking systems: one column, standard section names, real selectable text, no tables or images.</li>
                    <li>The roles I am looking for, my availability and the strongest numbers sit in the first third of page one.</li>
                    <li>Contact details are in the text and every link is clickable.</li>
                  </ul>
                  <Facts
                    rows={[
                      ["Pages", "2, A4"],
                      ["Format", "PDF"],
                      ["Address", "ridwaanhall.com/cv.pdf"],
                    ]}
                  />
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <CvButton icon="eye" label="Read it here" />
                    <a className="btn ghost" href={CV_FILE} target="_blank" rel="noopener">
                      <Icon name="out" />
                      Open the PDF
                    </a>
                    {about.cv.latest && (
                      <TextLink href={about.cv.latest} icon="file">
                        Google Docs version
                      </TextLink>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section id="experience" className="sec">
              <Heading title="Where I have worked" count={experiences.length} note={`${companies.length} organisations, newest first.`} />
              {experiences.length === 0 && (
                <Empty small icon="briefcase" title="No roles listed yet" note="Each role appears with its organisation, dates and what the work involved." />
              )}
              {companies.map(([company, roles]) => {
                const logo = roles.find((role) => role.logo)?.logo ?? "";
                const website = roles.find((role) => role.website)?.website;
                return (
                  <div key={company} className="org">
                    <Logo src={logo} name={company} />
                    <div style={{ minWidth: 0 }}>
                      <h3 className="t3">
                        {website ? (
                          <a className="ul" href={website} target="_blank" rel="noopener noreferrer">
                            {company}
                          </a>
                        ) : (
                          company
                        )}
                      </h3>
                      {roles.length > 1 && <p className="meta">{roles.length} roles</p>}
                      {roles.map((role) => (
                        <div key={role.id} className="role">
                          <div>
                            <b>{role.title}</b> {role.is_current && <Tag kind="solid">Current</Tag>}
                          </div>
                          <span className="when mono mute">{periodLabel(role)}</span>
                          <span className="meta">{[role.employment_type, role.location_type, role.location].filter(Boolean).join(" · ")}</span>
                          {role.responsibilities.length > 0 && (
                            <div style={{ gridColumn: "1 / -1" }}>
                              <Disclosure inline label="What I did">
                                <ul className="bul">
                                  {role.responsibilities.map((line) => (
                                    <li key={line}>{line}</li>
                                  ))}
                                </ul>
                              </Disclosure>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>

            {memberships.length > 0 && (
              <section id="organizations" className="sec">
                <Heading
                  title="Organizations"
                  count={memberships.length}
                  note="Roles held outside work: associations and the communities I helped run."
                />
                {memberships.map((role) => (
                  <div key={role.id} className="org">
                    <Logo src={role.logo} name={role.organization} />
                    <div style={{ minWidth: 0 }}>
                      <h3 className="t3">
                        {role.website ? (
                          <a className="ul" href={role.website} target="_blank" rel="noopener noreferrer">
                            {role.organization}
                          </a>
                        ) : (
                          role.organization
                        )}
                      </h3>
                      <div className="role">
                        <div>
                          <b>{role.title}</b> {role.is_current && <Tag kind="solid">Current</Tag>}
                        </div>
                        <span className="when mono mute">{periodLabel(role)}</span>
                        {role.location && <span className="meta">{role.location}</span>}
                        {role.responsibilities.length > 0 && (
                          <div style={{ gridColumn: "1 / -1" }}>
                            <Disclosure inline label="What I did">
                              <ul className="bul">
                                {role.responsibilities.map((line) => (
                                  <li key={line}>{line}</li>
                                ))}
                              </ul>
                            </Disclosure>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}

            <section id="education" className="sec">
              <Heading title="Where I studied" count={education.length} />
              {education.length === 0 && (
                <Empty small icon="school" title="No schools listed yet" note="Schools appear with their logos, years and what was taken from each." />
              )}
              {education.map((item) => {
                const span =
                  item.years ||
                  (item.date ? [monthYearLabel(item.date.start), monthYearLabel(item.date.end)].filter(Boolean).join(" – ") : "");
                return (
                  <div key={`${item.institution}-${item.degree}`} className="org">
                    <Logo src={item.logo} name={item.institution} />
                    <div style={{ minWidth: 0 }}>
                      <div className="role" style={{ paddingTop: 0 }}>
                        <h3 className="t3">
                          {item.website ? (
                            <a className="ul" href={item.website} target="_blank" rel="noopener noreferrer">
                              {item.institution}
                            </a>
                          ) : (
                            item.institution
                          )}
                        </h3>
                        <span className="when mono mute">{span}</span>
                        <span className="meta">
                          {item.degree}
                          {item.alias && ` (${item.alias})`}
                          {[item.location?.regency, item.location?.country].filter(Boolean).length > 0 &&
                            ` · ${[item.location?.regency, item.location?.country].filter(Boolean).join(", ")}`}
                        </span>
                      </div>
                      {item.achievements.length > 0 && (
                        <Disclosure inline label="What I took from it">
                          <ul className="bul">
                            {item.achievements.map((line) => (
                              <li key={line}>{line}</li>
                            ))}
                          </ul>
                        </Disclosure>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>

            <section id="skills" className="sec">
              <Heading title="What I work with" count={skillCount} note={`${Object.keys(skills).length} groups.`} />
              {skillCount === 0 ? (
                <Empty small icon="tool" title="No skills listed yet" note="Skills appear in their groups, each with its own icon." />
              ) : (
                <SkillGroups
                  groups={Object.entries(skills).map(([category, list]) => [category, list.map(skillIcon)])}
                  projects={projects.map(projectView).map(({ slug, title, kind, year, image, stack }) => ({ slug, title, kind, year, image, stack }))}
                />
              )}
            </section>

            <section id="recognition" className="sec">
              <Heading title="Recognition" count={awards.length} />
              {awards.length === 0 && <Empty small icon="award" title="No awards yet" note="Awards appear with the issuer, the date and what they were for." />}
              <div className="rows" style={{ borderTop: 0 }}>
                {awards.map((award) => (
                  <div key={award.id} className="org" style={{ borderTop: 0 }}>
                    <Logo src={award.logo} name={award.institution} />
                    <div>
                      <div className="role" style={{ paddingTop: 0 }}>
                        <b style={{ fontWeight: 500, fontSize: "1.05rem" }}>
                          {award.credential_url ? (
                            <a className="ul" href={award.credential_url} target="_blank" rel="noopener noreferrer">
                              {award.title}
                            </a>
                          ) : (
                            award.title
                          )}
                        </b>
                        <span className="when mono mute">{monthYearLabel(award.issued)}</span>
                        <span className="meta">{award.institution}</span>
                      </div>
                      {award.description && award.description !== award.title && (
                        <p className="meta" style={{ marginTop: 8, fontSize: 14.5 }}>
                          {award.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="certifications" className="sec">
              <Heading title="Certifications" count={certifications.length} note={`${years} years · newest first`}>
                <TextLink href={`https://www.linkedin.com/in/${about.username}/details/certifications/`} brand="linkedin">
                  All on LinkedIn
                </TextLink>
              </Heading>
              {certifications.length === 0 ? (
                <Empty small icon="file" title="No certifications yet" note="They are grouped by year, newest first, with the issuer's logo." />
              ) : (
                <Certifications items={certifications.map(certView)} />
              )}
            </section>

            <section id="job-hunt" className="sec">
              <Heading title="The job hunt, in public" count={applications.length} note="Every application, how it went, and what it taught me." />
              {applications.length === 0 ? (
                <Empty small icon="inbox" title="No applications logged" note="Each application appears with its steps, its outcome and what it taught me." />
              ) : (
                <JobHunt items={applications.map(applicationView)} />
              )}
            </section>
          </div>
        </div>
      </div>
      <PageMotion />
    </main>
  );
}
