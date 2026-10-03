import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EYEBROW, LINE_BUTTON, SOLID_BUTTON } from "@/components/foothill/classes";
import { MAIN, WRAP } from "@/components/foothill/layout";
import { PageMotion } from "@/components/foothill/page-motion";
import { Arrow, Fact, PageHead } from "@/components/foothill/ui";
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

  return (
    <main className={MAIN}>
      <JsonLdScript schemas={openhireSchemas()} />
      <div className={WRAP}>
        <PageHead eyebrow="Open-hire" title={head.title} lead={head.lead}>
          {about.is_open_to_work && about.is_hiring && (
            <div data-fh-enter className="mt-8 flex flex-wrap gap-3">
              <a href="#open-to-work" className={SOLID_BUTTON}>
                I have a role for you
              </a>
              <a href="#hiring" className={LINE_BUTTON}>
                I want to join RoneAI
              </a>
            </div>
          )}
        </PageHead>

        {about.is_open_to_work && (
          <section id="open-to-work" aria-labelledby="otw-title" className="mt-24 scroll-mt-28 md:mt-32">
            <h2 id="otw-title" className={`${EYEBROW} border-t border-line pt-4`}>
              Open to work
            </h2>
            {openToWork ? (
              <OpenToWork data={openToWork} tools={tools} cv={about.cv} />
            ) : (
              <Unavailable what="The details of what I am looking for" />
            )}
          </section>
        )}

        {about.is_hiring && (
          <section id="hiring" aria-labelledby="hiring-title" className="mt-24 scroll-mt-28 md:mt-32">
            <h2 id="hiring-title" className={`${EYEBROW} border-t border-line pt-4`}>
              Hiring
            </h2>
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
          <p data-fh-reveal className="flex items-center gap-3 text-[15px] text-ink">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-sulfur-mark" />
            {data.status}
            {data.availability && <span className="text-mute">· available {data.availability.toLowerCase()}</span>}
          </p>
        )}

        {data.preferred_roles.length > 0 && (
          <ul data-fh-reveal data-fh-stagger className="mt-8">
            {data.preferred_roles.map((role) => (
              <li
                key={role}
                className="border-t border-line py-3 text-[clamp(1.375rem,1.1rem+1.2vw,2.125rem)] leading-tight font-medium tracking-[-0.025em] text-ink last:border-b"
              >
                {role}
              </li>
            ))}
          </ul>
        )}

        <div data-fh-reveal className="mt-12 border-t border-line">
          <Tags label="Employment" items={data.type} />
          <Tags label="Work mode" items={data.location_types} />
          <Tags label="Preferred locations" items={data.preferred_locations} />
          <Tags label="Remote, from" items={data.remote_locations} />
          <Tags label="Languages" items={data.languages} />
          <Tags label="Strongest in" items={data.skills_highlight} />
        </div>

        {data.portfolio_highlights.length > 0 && (
          <div className="mt-14">
            <p className={EYEBROW}>Worth a look</p>
            <ul data-fh-reveal data-fh-stagger className="mt-4 border-b border-line">
              {data.portfolio_highlights.map((item) => (
                <li key={item.title} className="border-t border-line py-4">
                  <p className="text-[17px] text-ink">{item.title}</p>
                  {item.description && (
                    <p className="mt-1 max-w-[62ch] text-[15px] leading-relaxed text-mute">{item.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {tools && Object.keys(tools).length > 0 && (
          <div className="mt-14">
            <p className={EYEBROW}>Every tool I use</p>
            <dl data-fh-reveal className="mt-4 grid gap-x-10 border-t border-line md:grid-cols-2">
              {Object.entries(tools).map(([category, list]) => (
                <div key={category} className="border-b border-line py-3.5">
                  <dt className="text-[13px] text-mute">{category}</dt>
                  <dd className="mt-1 text-[15px] leading-relaxed text-ink">
                    {list.map((skill) => skill.name).join(", ")}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      <aside className="lg:col-span-4 lg:col-start-9">
        <div className="lg:sticky lg:top-28">
          <dl data-fh-reveal className="border-t border-line">
            {data.experience_level && <Fact label="Level">{data.experience_level}</Fact>}
            {data.availability && <Fact label="Available">{data.availability}</Fact>}
            {data.notice_period && <Fact label="Notice">{data.notice_period}</Fact>}
            {data.work_authorization && <Fact label="Authorised">{data.work_authorization}</Fact>}
            <Fact label="Remote">{yes(data.remote)}</Fact>
            <Fact label="Relocate">{yes(data.relocation)}</Fact>
            {data.salary_expectation && <Fact label="Salary">{data.salary_expectation}</Fact>}
            {data.interview_availability && <Fact label="Interviews">{data.interview_availability}</Fact>}
            {data.contact_preference && <Fact label="Reach me by">{data.contact_preference}</Fact>}
          </dl>
          {data.additional_notes && (
            <p className="fh-serif mt-6 text-[17px] leading-relaxed text-mute italic">{data.additional_notes}</p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            {cv.main && (
              <a href="/cv" target="_blank" rel="noopener noreferrer" className={`group ${SOLID_BUTTON}`}>
                Read the CV <Arrow diagonal />
              </a>
            )}
            <Link href="/contact" className={LINE_BUTTON}>
              Get in touch
            </Link>
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
          <p data-fh-reveal className="text-[clamp(1.75rem,1.3rem+2vw,2.75rem)] leading-[1.1] font-medium tracking-[-0.03em] text-ink">
            {data.company_name}
            {data.hiring_status && (
              <span className="fh-mono ml-4 align-middle text-[11px] tracking-[0.14em] text-sulfur uppercase">
                {data.hiring_status}
              </span>
            )}
          </p>
          {data.company_description && (
            <p className="fh-serif mt-4 max-w-[52ch] text-[20px] leading-[1.45] text-mute">
              {data.company_description}
            </p>
          )}
          {data.website && (
            <a href={data.website} target="_blank" rel="noopener noreferrer" className="group mt-4 inline-block text-[15px] text-ink">
              <span className="fh-link">{bareUrl(data.website)}</span> <Arrow diagonal className="text-mute" />
            </a>
          )}
        </div>
      </div>

      {data.positions.length > 0 && (
        <div className="mt-14">
          <p className={EYEBROW}>
            Open positions <span className="ml-2 text-ink">{data.positions.length}</span>
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
            <ol data-fh-reveal data-fh-stagger className="mt-4 border-b border-line">
              {data.application_process.map((step, index) => (
                <li key={step} className="grid grid-cols-[2.5rem_minmax(0,1fr)] border-t border-line py-3.5 text-[15px] leading-relaxed">
                  <span className="fh-mono text-[12px] text-mute tabular-nums">{index + 1}</span>
                  <span className="text-ink">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        {data.company_culture.length > 0 && (
          <div>
            <p className={EYEBROW}>What it is like</p>
            <ul data-fh-reveal data-fh-stagger className="mt-4 border-b border-line">
              {data.company_culture.map((line) => (
                <li key={line} className="border-t border-line py-3.5 text-[15px] leading-relaxed text-ink">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}
        {(data.requirements.general.length > 0 || data.requirements.technical.length > 0) && (
          <div>
            <p className={EYEBROW}>What we look for</p>
            <ul data-fh-reveal className="mt-4 border-b border-line">
              {[...data.requirements.general, ...data.requirements.technical].map((line) => (
                <li key={line} className="border-t border-line py-3.5 text-[15px] leading-relaxed text-ink">
                  {line}
                </li>
              ))}
            </ul>
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
            <p className="fh-serif mt-6 text-[17px] leading-relaxed text-mute italic">{data.additional_notes}</p>
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
      <details className="group">
        <summary className="grid cursor-pointer list-none gap-y-1.5 py-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-baseline md:gap-x-8 [&::-webkit-details-marker]:hidden">
          <span className="text-[clamp(1.25rem,1.05rem+0.9vw,1.75rem)] font-medium tracking-[-0.02em] text-ink">
            {position.title}
          </span>
          <span className="fh-mono flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-mute">
            {[position.type, position.location, position.salary_range].filter(Boolean).join(" · ")}
            <span className="inline-block transition-transform group-open:rotate-45">+</span>
          </span>
        </summary>
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
              className={`group mt-8 ${SOLID_BUTTON}`}
            >
              Apply for this role <Arrow />
            </a>
          )}
        </div>
      </details>
    </li>
  );
}
