import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Disclosure } from "@/components/foothill/controls";
import { CvButton } from "@/components/foothill/cv";
import { MAIN } from "@/components/foothill/layout";
import { PageMotion, Reveal } from "@/components/foothill/motion";
import { Button, Empty, Facts, Heading, PageHead, SkillChip, Tag, TextLink } from "@/components/foothill/ui";
import { JsonLdScript } from "@/components/seo/json-ld";
import type { Skill } from "@/lib/data/about";
import { getAboutData, getSkillsByCategory } from "@/lib/data/about";
import type { HiringData, OpenToWorkData } from "@/lib/data/openhire";
import { getHiringData, getOpenToWorkData } from "@/lib/data/openhire";
import { openhireSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { openhireSchemas } from "@/lib/seo/schemas-for-page";
import { bareUrl } from "@/lib/site/display";
import { skillIcon } from "@/lib/site/skills";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutData();
  if (!about) return {};
  return buildMetadata(openhireSeo(about), about);
}

function heading(openToWork: boolean, hiring: boolean) {
  if (openToWork && hiring)
    return { title: "Open to work, and hiring.", lead: "What I am looking for in my next role, and the people RoneAI is looking for." };
  if (openToWork) return { title: "Open to work.", lead: "What I am looking for, when I can start, and how to reach me." };
  return { title: "Hiring.", lead: "RoneAI is looking for people who like to build carefully. Here is what is open and how to apply." };
}

/** A titled list, as the page's columns are made of. A list nobody filled in is left out. */
function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="meta" style={{ marginBottom: 10 }}>
        {title}
      </p>
      <ul className="bul" style={{ paddingBottom: 0 }}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

const yesNo = (value: boolean) => (value ? "Yes" : "No");

export default async function OpenHirePage() {
  const about = await getAboutData();
  if (!about) return null;
  if (!about.is_open_to_work && !about.is_hiring) notFound();

  const [openToWork, hiring] = await Promise.all([
    about.is_open_to_work ? getOpenToWorkData() : Promise.resolve(null),
    about.is_hiring ? getHiringData() : Promise.resolve(null),
  ]);
  const tools = openToWork?.show_all_tools_skills ? await getSkillsByCategory() : null;
  const head = heading(about.is_open_to_work, about.is_hiring);
  const facts = [
    openToWork?.status ? ["Status", <Tag key="status" kind="solid">{openToWork.status}</Tag>] : null,
    openToWork?.availability ? ["Available", openToWork.availability] : null,
    openToWork?.experience_level ? ["Level", openToWork.experience_level] : null,
    openToWork?.notice_period ? ["Notice", openToWork.notice_period] : null,
    !openToWork && hiring ? ["Open roles", hiring.positions.length] : null,
  ].filter(Boolean) as [string, React.ReactNode][];

  return (
    <main className={MAIN}>
      <JsonLdScript schemas={openhireSchemas()} />
      <div>
        <PageHead title={head.title} lead={head.lead} facts={facts} markdown="/openhire" />
        {openToWork && <OpenToWork data={openToWork} tools={tools} />}
        {hiring && <Hiring data={hiring} />}
      </div>
      <PageMotion />
    </main>
  );
}

function OpenToWork({ data, tools }: { data: OpenToWorkData; tools: Record<string, Skill[]> | null }) {
  return (
    <>
      <section id="open-to-work" className="wrap sec" style={{ borderTop: 0, paddingTop: 0 }}>
        <Heading title="What I am looking for" note={data.additional_notes || undefined} />
        <div className="pgrid three" style={{ gap: 32 }}>
          <div className="stack">
            <List title="Roles" items={data.preferred_roles} />
            <List title="Employment" items={data.type} />
            <List title="Work mode" items={data.location_types} />
          </div>
          <div className="stack">
            <List title="Preferred locations" items={data.preferred_locations} />
            <List title="Remote, from" items={data.remote_locations} />
            <List title="Languages" items={data.languages} />
          </div>
          <div className="stack">
            <List title="Strongest in" items={data.skills_highlight} />
            <Facts
              rows={
                [
                  data.work_authorization ? ["Authorised", data.work_authorization] : null,
                  ["Remote", yesNo(data.remote)],
                  ["Relocate", yesNo(data.relocation)],
                  data.salary_expectation ? ["Salary", data.salary_expectation] : null,
                  data.interview_availability ? ["Interviews", data.interview_availability] : null,
                  data.contact_preference ? ["Reach me by", data.contact_preference] : null,
                ].filter(Boolean) as [string, string][]
              }
            />
          </div>
        </div>
      </section>

      <section className="wrap sec">
        <Heading title="Work I would point to" count={data.portfolio_highlights.length} />
        {data.portfolio_highlights.length ? (
          <Reveal stagger className="pgrid three">
            {data.portfolio_highlights.map((item) => (
              <div key={item.title} className="feature">
                <h3 className="t3">{item.title}</h3>
                <p className="meta">{item.description}</p>
              </div>
            ))}
          </Reveal>
        ) : (
          <Empty small icon="grid" title="No highlights picked yet" note="Three projects worth a hiring manager's time will be listed here." />
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 32 }}>
          <Button href="/contact" icon="pen">
            Write to me about a role
          </Button>
          <CvButton ghost />
        </div>
      </section>

      {tools && Object.keys(tools).length > 0 && (
        <section className="wrap sec">
          <Heading title="Everything I work with" count={Object.values(tools).flat().length} note={`${Object.keys(tools).length} groups.`} />
          <div className="skills-grid">
            {Object.entries(tools).map(([category, list]) => (
              <div key={category} className="sk-row">
                <span className="meta">
                  {category} · {list.length}
                </span>
                <div className="sk-list">
                  {list.map((skill) => (
                    <SkillChip key={skill.name} skill={skillIcon(skill)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Hiring({ data }: { data: HiringData }) {
  return (
    <section id="hiring" className="wrap sec">
      <Heading title={`Build with ${data.company_name}`} count={`${data.positions.length} open`} note={data.company_description}>
        {data.website && (
          <TextLink href={data.website} icon="globe">
            {bareUrl(data.website)}
          </TextLink>
        )}
      </Heading>
      {data.positions.length === 0 ? (
        <Empty
          icon="briefcase"
          title={`No open roles at ${data.company_name} right now`}
          note="Openings are posted here first. Write in anyway if the work below sounds like yours."
          action={
            <Button sm ghost href="/contact" icon="pen">
              Write in
            </Button>
          }
        />
      ) : (
        <div className="rows">
          {data.positions.map((position, index) => (
            <div key={position.title} style={{ borderBottom: "1px solid var(--fh-line)" }}>
              <Disclosure
                open={index === 0}
                label={
                  <span style={{ display: "grid" }}>
                    <span className="t3">{position.title}</span>
                    <span className="meta">
                      {[position.experience_required, position.salary_range, position.type, position.location].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                }
              >
                <div className="pgrid" style={{ paddingBottom: 20 }}>
                  <List title="What you would do" items={position.responsibilities} />
                  <List title="Skills" items={position.skills_required} />
                  <List title="Technical" items={data.requirements.technical} />
                  <List title="General" items={data.requirements.general} />
                  <List title="What you get" items={position.benefits} />
                </div>
              </Disclosure>
            </div>
          ))}
        </div>
      )}
      <div className="pgrid three" style={{ marginTop: 32, gap: 32 }}>
        <List title="How we work" items={data.company_culture} />
        <List title="The process" items={data.application_process} />
        <div>
          <Facts
            rows={
              [
                ["Status", data.hiring_status],
                data.contact_info.response_time ? ["Replies", data.contact_info.response_time] : null,
                data.contact_info.interview_process ? ["Interviews", data.contact_info.interview_process] : null,
              ].filter(Boolean) as [string, string][]
            }
          />
          {data.additional_notes && (
            <p className="meta" style={{ marginTop: 14 }}>
              {data.additional_notes}
            </p>
          )}
          {data.contact_info.application_email && (
            <div style={{ marginTop: 18 }}>
              <Button sm href={`mailto:${data.contact_info.application_email}`} icon="mail">
                Apply by email
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
