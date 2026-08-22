import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLdScript } from "@/components/seo/json-ld";
import { AboutTabs } from "@/components/site/about-tabs";
import {
  BulletLines,
  DetailRow,
  ICON,
  SectionCard,
  StatusPill,
  TagList,
  YesNo,
} from "@/components/site/openhire-cards";
import { CvDownload } from "@/components/site/cv-download";
import { PositionCard } from "@/components/site/position-card";
import type { Skill } from "@/lib/data/about";
import { getAboutData, getSkillsByCategory } from "@/lib/data/about";
import type { HiringData, OpenToWorkData } from "@/lib/data/openhire";
import { getHiringData, getOpenToWorkData } from "@/lib/data/openhire";
import { openhireSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { openhireSchemas } from "@/lib/seo/schemas-for-page";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutData();
  if (!about) return {};
  return buildMetadata(openhireSeo(about), about);
}

/**
 * The intro line, which states whichever combination of the two flags is set.
 * Django spelled this out as a four-branch `{% if %}`; the fourth branch was
 * unreachable, since the view 404s when neither flag is on.
 */
function intro(openToWork: boolean, hiring: boolean): string {
  if (openToWork && hiring) {
    return "Connecting talent with opportunity. I'm open to new roles and actively hiring great people.";
  }
  if (openToWork) return "Currently open to new opportunities and exciting challenges.";
  return "Building amazing teams and looking for passionate individuals to join us.";
}

export default async function OpenHirePage() {
  const about = await getAboutData();
  if (!about) return null;

  // The page exists only while one of the flags is set -- the same check
  // OpenHireView made before raising Http404.
  if (!about.is_open_to_work && !about.is_hiring) notFound();

  const [openToWork, hiring] = await Promise.all([getOpenToWorkData(), getHiringData()]);

  // `used_tools_skills` is not stored on the profile: the view built it from
  // the skills catalogue whenever the flag was set, and so does this.
  const toolsByCategory = openToWork?.show_all_tools_skills ? await getSkillsByCategory() : null;

  const openPanel = openToWork ? (
    <OpenToWorkPanel data={openToWork} tools={toolsByCategory} />
  ) : (
    <p className="text-zinc-400">Open to work information is not available at the moment.</p>
  );
  const hiringPanel = hiring ? (
    <HiringPanel data={hiring} />
  ) : (
    <p className="text-zinc-400">Hiring information is not available at the moment.</p>
  );

  return (
    <>
      <JsonLdScript schemas={openhireSchemas()} />
      <main className="px-3 py-4 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 md:mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
              <div>
                <h1 className="text-2xl lg:text-3xl font-medium mb-2 tracking-tight">
                  Career Opportunities
                </h1>
                <p className="mt-2 text-base sm:text-lg text-zinc-300 leading-relaxed">
                  {intro(about.is_open_to_work, about.is_hiring)}
                </p>
              </div>
            </div>
          </div>

          {about.is_open_to_work && about.is_hiring ? (
            <AboutTabs
              tabs={[
                { id: "opentowork", label: "Open to Work", content: openPanel },
                { id: "hiring", label: "Hiring", content: hiringPanel },
              ]}
            />
          ) : (
            <div className="w-full">{about.is_open_to_work ? openPanel : hiringPanel}</div>
          )}
        </div>
      </main>
    </>
  );
}

/** The wrapper both panels share. */
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 sm:mt-6">
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function OpenToWorkPanel({
  data,
  tools,
}: {
  data: OpenToWorkData;
  tools: Record<string, Skill[]> | null;
}) {
  return (
    <Panel>
      {/* The same banner the about page's Intro tab opens with, rather than a
          second CV block with its own layout and one format fewer. */}
      <CvDownload />

      <SectionCard
        title="Status & Availability"
        paths={[ICON.user]}
        badge={<StatusPill text={data.status} />}
      >
        <div className="space-y-2">
          <DetailRow label="Availability">{data.availability}</DetailRow>
          <DetailRow label="Employment Type">{data.type.join(", ")}</DetailRow>
          <DetailRow label="Remote Work" muted={false}>
            <YesNo yes={data.remote} on="Available" off="Not Available" />
          </DetailRow>
          <DetailRow label="Relocation" muted={false}>
            <YesNo yes={data.relocation} on="Open to Relocate" off="No Relocation" />
          </DetailRow>
        </div>
      </SectionCard>

      <SectionCard title="Preferred Roles" paths={[ICON.briefcase]}>
        <TagList items={data.preferred_roles} />
      </SectionCard>

      <SectionCard title="Skills Highlight" paths={[ICON.lightbulb]}>
        <TagList items={data.skills_highlight} />
      </SectionCard>

      <SectionCard title="Professional Details" paths={[ICON.idCard]}>
        <div className="space-y-2">
          <DetailRow label="Experience Level">{data.experience_level}</DetailRow>
          <DetailRow label="Salary Expectation">{data.salary_expectation}</DetailRow>
          <DetailRow label="Notice Period">{data.notice_period}</DetailRow>
          <DetailRow label="Work Authorization">{data.work_authorization}</DetailRow>
        </div>
      </SectionCard>

      <SectionCard title="Languages & Preferences" paths={[ICON.translate]}>
        <div className="space-y-2">
          <DetailRow label="Languages">{data.languages.join(", ")}</DetailRow>
          <DetailRow label="Contact Preference">{data.contact_preference}</DetailRow>
          <DetailRow label="Interview Availability">{data.interview_availability}</DetailRow>
        </div>
      </SectionCard>

      <SectionCard title="Location Preferences" paths={[ICON.pinOuter, ICON.pinInner]}>
        <div className="space-y-0">
          <LocationGroup title="Work Arrangements" items={data.location_types} />
          <LocationGroup title="On-site Locations" items={data.preferred_locations} />
          <LocationGroup title="Remote Locations" items={data.remote_locations} />
        </div>
      </SectionCard>

      {tools && Object.keys(tools).length > 0 ? <ToolsTable tools={tools} /> : null}
    </Panel>
  );
}

function LocationGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="p-2">
      <h3 className="text-lg font-medium text-indigo-400 mb-3">{title}</h3>
      <TagList items={items} className="mt-1.5" />
    </div>
  );
}

/**
 * The skills catalogue as a category/tools table.
 *
 * One row per category, tools joined with commas -- Django built the join in
 * the template with `{% if not forloop.last %}, {% endif %}`.
 */
function ToolsTable({ tools }: { tools: Record<string, Skill[]> }) {
  return (
    <SectionCard title="Tools & Technologies" paths={[ICON.cogOuter, ICON.cogInner]}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-700">
              <th className="text-left py-2 px-3 text-zinc-400 font-medium text-xs uppercase tracking-wider w-28 sm:w-36">
                Category
              </th>
              <th className="text-left py-2 px-3 text-zinc-400 font-medium text-xs uppercase tracking-wider">
                Tools
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700/50">
            {Object.entries(tools).map(([category, skills]) => (
              <tr key={category} className="hover:bg-zinc-800/30 transition-colors">
                <td className="py-2 px-3 font-medium text-zinc-300 text-xs sm:text-sm align-top whitespace-nowrap">
                  {category}
                </td>
                <td className="py-2 px-3 text-zinc-400 text-xs">
                  {skills.map((skill) => skill.name).join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function HiringPanel({ data }: { data: HiringData }) {
  return (
    <Panel>
      <SectionCard
        title="Company Overview"
        paths={[ICON.building]}
        badge={<StatusPill text={data.hiring_status} />}
      >
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-zinc-200">{data.company_name}</h3>
          <p className="text-sm leading-relaxed text-zinc-400">{data.company_description}</p>
          {data.website ? (
            <a
              href={data.website}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors text-sm mt-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Visit {data.company_name}
            </a>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="Open Positions" paths={[ICON.briefcase]}>
        {/* Wider than the `space-y-3` these had while each was its own bordered
            box. Without the box, 12px is not enough to say where one posting
            ends and the next begins. */}
        <div className="space-y-6">
          {data.positions.map((position) => (
            <PositionCard
              key={position.title}
              position={position}
              applicationEmail={data.contact_info.application_email}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Application Process" paths={[ICON.clipboard]}>
        <div className="space-y-2">
          {data.application_process.map((step, index) => (
            <div key={step} className="flex items-start gap-3 p-2 bg-zinc-800/30 rounded">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-900/30 text-indigo-300 rounded-full flex items-center justify-center text-xs font-medium border border-indigo-700/50">
                {index + 1}
              </span>
              <span className="text-sm text-zinc-300">{step}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/*
        Full width, one after another, like every other section on the page.
        These were three columns from `md` up, which gave a bulleted list a
        third of the measure and set them to a different rhythm from Contact
        Information and Application Process directly above and below.
      */}
      <SectionCard title="Company Culture" paths={[ICON.users]}>
        <BulletLines items={data.company_culture} />
      </SectionCard>

      {data.requirements.general.length > 0 ? (
        <SectionCard title="General Requirements" paths={[ICON.shield]}>
          <BulletLines items={data.requirements.general} />
        </SectionCard>
      ) : null}

      {data.requirements.technical.length > 0 ? (
        <SectionCard title="Technical Requirements" paths={[ICON.code]}>
          <BulletLines items={data.requirements.technical} />
        </SectionCard>
      ) : null}

      <SectionCard title="Contact Information" paths={[ICON.mail]}>
        <div className="space-y-2">
          <DetailRow label="General Inquiries">{data.contact_info.email}</DetailRow>
          <DetailRow label="Applications">{data.contact_info.application_email}</DetailRow>
          <DetailRow label="Response Time">{data.contact_info.response_time}</DetailRow>
          <DetailRow label="Interview Process">{data.contact_info.interview_process}</DetailRow>
        </div>
      </SectionCard>

      {data.additional_notes ? (
        <SectionCard title="Join Our Team" paths={[ICON.info]}>
          <p className="text-sm leading-relaxed text-zinc-400">{data.additional_notes}</p>
        </SectionCard>
      ) : null}
    </Panel>
  );
}
