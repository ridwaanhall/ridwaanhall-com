import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {EYEBROW, H3, LINE_BUTTON, SOLID_BUTTON } from "@/components/foothill/classes";
import { Collapsible } from "@/components/foothill/expand";
import { Icon } from "@/components/foothill/icons";
import { MAIN, WRAP } from "@/components/foothill/layout";
import { PageMotion, Reveal, Roll } from "@/components/foothill/motion";
import { ActionLink, Fact, Glance, Heading, PageHead } from "@/components/foothill/ui";
import { JsonLdScript } from "@/components/seo/json-ld";
import type { Skill } from "@/lib/data/about";
import { getAboutData, getSkillsByCategory } from "@/lib/data/about";
import type { HiringData, OpenToWorkData, Position } from "@/lib/data/openhire";
import { getHiringData, getOpenToWorkData } from "@/lib/data/openhire";
import { openhireSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { openhireSchemas } from "@/lib/seo/schemas-for-page";
import { bareUrl } from "@/lib/site/display";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutData();
  if (!about) return {};
  return buildMetadata(openhireSeo(about), about);
}

function heading(openToWork: boolean, hiring: boolean) {
  if (openToWork && hiring) {
    return {
      title: "Open to work, and hiring.",
      lead: "Both doors are open. If you have a role for me, the first half is for you; if you want to build with RoneAI, the second is.",
    };
  }
  if (openToWork) {
    return {
      title: "Open to work.",
      lead: "What I am looking for, when I can start, and how to reach me.",
    };
  }
  return {
    title: "Hiring.",
    lead: "RoneAI is looking for people who like to build carefully. Here is what is open and how to apply.",
  };
}

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
  // The page's answers in brief: when he could start and how, and what is
  // open at RoneAI. A blank value is a field nobody filled in, so it is left out.
  const glance = [
    { label: "Available", value: openToWork?.availability },
    { label: "Works", value: openToWork?.location_types.join(", ") },
    { label: "Open positions", value: hiring ? String(hiring.positions.length) : "" },
    { label: "Replies", value: hiring?.contact_info.response_time },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));

  return (
    <main className={MAIN}>
      <JsonLdScript schemas={openhireSchemas()} />
      <div className={WRAP}>
        <PageHead title={head.title} lead={head.lead} aside={glance.length > 0 && <Glance items={glance} />}>
          {about.is_open_to_work && about.is_hiring && (
            <div data-fh-enter className="mt-8 flex flex-wrap gap-3">
              <a href="#open-to-work" className={SOLID_BUTTON}>
                <Roll>I have a role for you</Roll>
                <Icon name="arrow-down" className="transition-transform duration-500 group-hover:translate-y-0.5" />
              </a>
              <a href="#hiring" className={LINE_BUTTON}>
                <Roll>I want to join RoneAI</Roll>
                <Icon name="arrow-down" className="transition-transform duration-500 group-hover:translate-y-0.5" />
              </a>
            </div>
          )}
        </PageHead>

        {about.is_open_to_work && (
          <section id="open-to-work" aria-labelledby="otw-title" className="mt-24 scroll-mt-28 md:mt-32">
            <Heading id="otw-title">What I am looking for</Heading>
            {openToWork ? (
              <OpenToWork data={openToWork} tools={tools} cv={about.cv} />
            ) : (
              <Unavailable what="The details of what I am looking for" />
            )}
          </section>
        )}

        {about.is_hiring && (
          <section id="hiring" aria-labelledby="hiring-title" className="mt-24 scroll-mt-28 md:mt-32">
            <Heading id="hiring-title">Build with RoneAI</Heading>
            {hiring ? <Hiring data={hiring} /> : <Unavailable what="The open positions" />}
          </section>
        )}
      </div>
      <PageMotion />
    </main>
  );
}

function Unavailable({ what }: { what: string }) {
  return (
    <p className="mt-8 text-[17px] text-mute">
      {what} are not published right now. Email me and I will send them over.
    </p>
  );
}

function Tags({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="border-b border-line py-4">
      <p className="text-[13px] text-mute">{label}</p>
      <p className="mt-1.5 text-[16px] leading-relaxed text-ink">{items.join(", ")}</p>
    </div>
  );
}

const yes = (value: boolean) => (value ? "Yes" : "No");

function OpenToWork({
  data,
  tools,
  cv,
}: {
  data: OpenToWorkData;
  tools: Record<string, Skill[]> | null;
  cv: { main: string; latest: string; copy: string };
}) {
  return (
    <div className="mt-10 grid gap-14 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-7">
        {data.status && (
          <Reveal as="p" className="flex items-center gap-3 text-[15px] text-ink">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-sulfur-mark" />
            {data.status}
            {data.availability && <span className="text-mute">, available {data.availability.toLowerCase()}</span>}
          </Reveal>
        )}

        {data.preferred_roles.length > 0 && (
          <Reveal as="ul" stagger className="mt-8">
            {data.preferred_roles.map((role) => (
              <li
                key={role}
                className="border-t border-line py-3 font-display text-[clamp(1.375rem,1.1rem+1.2vw,2.125rem)] leading-tight font-medium tracking-[-0.025em] text-ink last:border-b"
              >
                {role}
              </li>
            ))}
          </Reveal>
        )}

        <Reveal as="div" className="mt-12 border-t border-line">
          <Tags label="Employment" items={data.type} />
          <Tags label="Work mode" items={data.location_types} />
          <Tags label="Preferred locations" items={data.preferred_locations} />
          <Tags label="Remote, from" items={data.remote_locations} />
          <Tags label="Languages" items={data.languages} />
          <Tags label="Strongest in" items={data.skills_highlight} />
        </Reveal>

        {data.portfolio_highlights.length > 0 && (
          <div className="mt-14">
            <p className={EYEBROW}>Worth a look</p>
            <Reveal as="ul" stagger className="mt-4 border-b border-line">
              {data.portfolio_highlights.map((item) => (
                <li key={item.title} className="border-t border-line py-4">
                  <p className="text-[17px] text-ink">{item.title}</p>
                  {item.description && (
                    <p className="mt-1 max-w-[62ch] text-[15px] leading-relaxed text-mute">{item.description}</p>
                  )}
                </li>
              ))}
            </Reveal>
          </div>
        )}

        {tools && Object.keys(tools).length > 0 && (
          <div className="mt-14">
            <p className={EYEBROW}>Every tool I use</p>
            <Reveal as="dl" className="mt-4 grid gap-x-10 border-t border-line md:grid-cols-2">
              {Object.entries(tools).map(([category, list]) => (
                <div key={category} className="border-b border-line py-3.5">
                  <dt className="text-[13px] text-mute">{category}</dt>
                  <dd className="mt-1 text-[15px] leading-relaxed text-ink">
                    {list.map((skill) => skill.name).join(", ")}
                  </dd>
                </div>
              ))}
            </Reveal>
          </div>
        )}
      </div>

      <aside className="lg:col-span-4 lg:col-start-9">
        <div className="lg:sticky lg:top-28">
          <Reveal as="dl" className="border-t border-line">
            {data.experience_level && <Fact label="Level">{data.experience_level}</Fact>}
            {data.availability && <Fact label="Available">{data.availability}</Fact>}
            {data.notice_period && <Fact label="Notice">{data.notice_period}</Fact>}
            {data.work_authorization && <Fact label="Authorised">{data.work_authorization}</Fact>}
            <Fact label="Remote">{yes(data.remote)}</Fact>
            <Fact label="Relocate">{yes(data.relocation)}</Fact>
            {data.salary_expectation && <Fact label="Salary">{data.salary_expectation}</Fact>}
            {data.interview_availability && <Fact label="Interviews">{data.interview_availability}</Fact>}
            {data.contact_preference && <Fact label="Reach me by">{data.contact_preference}</Fact>}
          </Reveal>
          {data.additional_notes && (
            <p className="mt-6 text-[17px] leading-relaxed text-mute">{data.additional_notes}</p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            {cv.main && (
              <ActionLink href="/cv" external variant="solid" icon="doc">
                Read the CV
              </ActionLink>
            )}
            <ActionLink href="/contact" variant="line" icon="mail">
              Get in touch
            </ActionLink>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Hiring({ data }: { data: HiringData }) {
  return (
    <div className="mt-10">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Reveal as="p" className="font-display text-[clamp(1.75rem,1.3rem+2vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em] text-ink">
            {data.company_name}
            {data.hiring_status && (
              <span className="ml-4 rounded-full bg-raise px-3 py-1 align-middle font-text text-[13px] font-normal tracking-normal text-ink">
                {data.hiring_status}
              </span>
            )}
          </Reveal>
          {data.company_description && (
            <p className="mt-4 max-w-[52ch] text-[19px] leading-[1.5] text-mute">{data.company_description}</p>
          )}
          {data.website && (
            <ActionLink href={data.website} className="mt-5">
              {bareUrl(data.website)}
            </ActionLink>
          )}
        </div>
      </div>

      {data.positions.length > 0 && (
        <div className="mt-14">
          <p className={H3}>
            Open positions
            <sup className="ml-1.5 font-text text-[0.55em] font-normal text-mute">{data.positions.length}</sup>
          </p>
          <ul className="mt-4 border-b border-line">
            {data.positions.map((position) => (
              <PositionRow key={position.title} position={position} email={data.contact_info.application_email} />
            ))}
          </ul>
        </div>
      )}

      <div className="mt-16 grid gap-14 md:grid-cols-2">
        {data.application_process.length > 0 && (
          <div>
            <p className={EYEBROW}>How it goes</p>
            {/* Numbered because it is a sequence: each step follows the last. */}
            <Reveal as="ol" stagger className="mt-4 border-b border-line">
              {data.application_process.map((step, index) => (
                <li key={step} className="grid grid-cols-[2.5rem_minmax(0,1fr)] border-t border-line py-3.5 text-[15px] leading-relaxed">
                  <span className="font-display text-[15px] font-medium text-mute tabular-nums">{index + 1}</span>
                  <span className="text-ink">{step}</span>
                </li>
              ))}
            </Reveal>
          </div>
        )}
        {data.company_culture.length > 0 && (
          <div>
            <p className={EYEBROW}>What it is like</p>
            <Reveal as="ul" stagger className="mt-4 border-b border-line">
              {data.company_culture.map((line) => (
                <li key={line} className="border-t border-line py-3.5 text-[15px] leading-relaxed text-ink">
                  {line}
                </li>
              ))}
            </Reveal>
          </div>
        )}
        {(data.requirements.general.length > 0 || data.requirements.technical.length > 0) && (
          <div>
            <p className={EYEBROW}>What we look for</p>
            <Reveal as="ul" className="mt-4 border-b border-line">
              {[...data.requirements.general, ...data.requirements.technical].map((line) => (
                <li key={line} className="border-t border-line py-3.5 text-[15px] leading-relaxed text-ink">
                  {line}
                </li>
              ))}
            </Reveal>
          </div>
        )}
        <div>
          <p className={EYEBROW}>Contact</p>
          <dl className="mt-4 border-t border-line">
            {data.contact_info.email && (
              <Fact label="Email">
                <a href={`mailto:${data.contact_info.email}`} className="fh-link">
                  {data.contact_info.email}
                </a>
              </Fact>
            )}
            {data.contact_info.application_email && (
              <Fact label="Apply to">
                <a href={`mailto:${data.contact_info.application_email}`} className="fh-link">
                  {data.contact_info.application_email}
                </a>
              </Fact>
            )}
            {data.contact_info.response_time && <Fact label="Reply">{data.contact_info.response_time}</Fact>}
            {data.contact_info.interview_process && <Fact label="Interviews">{data.contact_info.interview_process}</Fact>}
          </dl>
          {data.additional_notes && (
            <p className="mt-6 text-[17px] leading-relaxed text-mute">{data.additional_notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PositionRow({ position, email }: { position: Position; email: string }) {
  const lists: [string, string[]][] = [
    ["You will", position.responsibilities],
    ["You bring", position.skills_required],
    ["You get", position.benefits],
  ];
  return (
    <li className="border-t border-line">
      <Collapsible
        summaryClassName="py-6"
        summary={
          <span className="grid flex-1 gap-y-1.5 md:grid-cols-[minmax(0,1fr)_auto] md:items-baseline md:gap-x-8">
            <span className="font-display text-[clamp(1.25rem,1.05rem+0.9vw,1.75rem)] font-medium tracking-[-0.02em] text-ink">
              {position.title}
            </span>
            <span className="text-[14px] text-mute">
              {[position.type, position.location, position.salary_range].filter(Boolean).join(", ")}
            </span>
          </span>
        }
      >
        <div className="pb-8">
          {position.experience_required && (
            <p className="text-[15px] text-mute">Experience: {position.experience_required}</p>
          )}
          <div className="mt-6 grid gap-10 md:grid-cols-3">
            {lists
              .filter(([, items]) => items.length > 0)
              .map(([label, items]) => (
                <div key={label}>
                  <p className="text-[13px] text-mute">{label}</p>
                  <ul className="mt-2 space-y-1.5 text-[15px] leading-relaxed text-ink">
                    {items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
          {email && (
            <a
              href={`mailto:${email}?subject=${encodeURIComponent(`Application: ${position.title}`)}`}
              className={`mt-8 ${SOLID_BUTTON}`}
            >
              <Roll>Apply for this role</Roll>
              <Icon name="send" className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          )}
        </div>
      </Collapsible>
    </li>
  );
}
