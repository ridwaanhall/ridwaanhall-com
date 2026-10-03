import Image from "next/image";

import { ArrowFx, LineText } from "@/components/motion/interactive";
import { Reveal } from "@/components/motion/reveal";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@/components/site/disclosure";
import type { Application, Award, Certification, Education, Experience } from "@/lib/data/about";
import { cn } from "@/lib/utils/cn";

/**
 * The About page's records, as a timeline rather than a stack of cards.
 *
 * Every entry is the same shape: when, on the left as a mono trace; what and
 * where, on the right; then whatever detail the record carries. Nothing is
 * ruled off -- entries are separated by their own padding.
 *
 * Two kinds of detail sit behind a "Show more". An employer's roles and their
 * responsibilities, because laid out in full they made this page fifteen
 * thousand pixels tall and buried every section below them -- collapsed, an
 * entry still says who, when, and the latest role. And an application's
 * journey, because it is a table of up to a dozen steps and sixty-odd of them
 * open at once would bury the list. Awards, education and certifications
 * stay open: their detail is a line or two.
 *
 * Colour is gone from all of it but the application outcome, where the colour
 * *is* the information -- and that is a dot beside the word, never the word's
 * only signal.
 */

const LINK =
  "rounded-full transition-colors duration-500 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";

function OrgMark({ logo, name, className }: { logo: string; name: string; className?: string }) {
  if (!logo) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-xs font-medium text-zinc-500",
          className,
        )}
      >
        {name.trim().charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    <Image
      src={logo}
      alt={`${name} logo`}
      width={72}
      height={72}
      className={cn("h-8 w-8 shrink-0 rounded-lg object-cover", className)}
    />
  );
}

function Org({ name, website }: { name: string; website: string }) {
  return website ? (
    <a href={website} target="_blank" rel="noopener noreferrer" className={cn(LINK, "inline-flex items-center gap-1")}>
      <LineText>{name}</LineText>
      <ArrowFx direction="up-right" className="h-3 w-3 opacity-60" />
    </a>
  ) : (
    <>{name}</>
  );
}

function Bullets({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-pretty text-zinc-400">
      {items.map((item, index) => (
        <li key={index} className="relative pl-4">
          <span aria-hidden="true" className="absolute top-[0.7em] left-0 h-px w-2 bg-zinc-600" />
          {item}
        </li>
      ))}
    </ul>
  );
}

/** One row of the timeline: the period on the left, the record on the right. */
function Entry({ when, children }: { when: React.ReactNode; children: React.ReactNode }) {
  return (
    <Reveal as="li" className="grid grid-cols-1 gap-x-8 gap-y-2 py-5 md:grid-cols-[9rem_1fr]">
      <div className="type-meta pt-1 text-zinc-500">{when}</div>
      <div className="min-w-0">{children}</div>
    </Reveal>
  );
}

export function Timeline({ children }: { children: React.ReactNode }) {
  return <ol>{children}</ol>;
}

function monthYearText(value: { month: string; year: number } | null | undefined): string {
  return value ? `${value.month} ${value.year}` : "";
}

/**
 * One employer, however many roles were held there.
 *
 * Collapsed, it is the company, how many positions, and the latest role --
 * enough to scan the page by. "Show more" opens every role with its dates,
 * terms and responsibilities. An employer with one role and nothing written
 * under it has nothing to open, so it gets no button.
 */
export function ExperienceEntry({ company, roles }: { company: string; roles: Experience[] }) {
  const first = roles[0];
  const start = roles[roles.length - 1]?.period.start;
  const end = first.period.end;
  const hasMore = roles.length > 1 || roles.some((role) => role.responsibilities.length > 0);

  return (
    <Entry
      when={
        <>
          {monthYearText(start)} – {end === "Present" ? "Present" : monthYearText(end)}
        </>
      }
    >
      <Disclosure>
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="flex min-w-0 items-center gap-3">
            <OrgMark logo={first.logo} name={company} />
            <div className="min-w-0">
              <h3 className="text-base leading-snug font-[560] tracking-[-0.01em] text-zinc-100 [font-stretch:104%]">
                <Org name={company} website={first.website} />
              </h3>
              <p className="type-meta text-zinc-500">
                {roles.length} position{roles.length === 1 ? "" : "s"}
                {first.is_current ? " · current" : ""}
              </p>
            </div>
          </div>
          {hasMore && <DisclosureButton />}
        </div>

        <p className="mt-3 text-sm text-zinc-300">
          {first.title}
          {roles.length > 1 && <span className="text-zinc-500"> and {roles.length - 1} more</span>}
        </p>

        {hasMore && (
          <DisclosurePanel className="space-y-6 pt-5">
            {roles.map((role) => (
              <div key={`${role.title}-${role.period.start_iso}`} className="pl-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h4 className="text-base font-[560] text-zinc-100">{role.title}</h4>
                  {role.is_current && <span className="type-meta text-zinc-500">current</span>}
                </div>
                <p className="type-meta mt-1.5 flex flex-wrap gap-x-2 text-zinc-500">
                  <span>
                    {monthYearText(role.period.start)} –{" "}
                    {role.period.end === "Present" ? "Present" : monthYearText(role.period.end)}
                  </span>
                  {role.employment_type && <span>· {role.employment_type}</span>}
                  {(role.location_type || role.location) && (
                    <span>
                      · {role.location_type}
                      {role.location_type && role.location ? ", " : ""}
                      {role.location}
                    </span>
                  )}
                </p>
                <Bullets items={role.responsibilities} />
              </div>
            ))}
          </DisclosurePanel>
        )}
      </Disclosure>
    </Entry>
  );
}

export function EducationEntry({ education }: { education: Education }) {
  const period = education.years
    ? education.years
    : education.date
      ? `${monthYearText(education.date.start)} – ${
          education.date.end ? monthYearText(education.date.end) : "Present"
        }`
      : "";

  return (
    <Entry when={period}>
      <div className="flex items-center gap-3">
        <OrgMark logo={education.logo} name={education.institution} className="rounded-full" />
        <div className="min-w-0">
          <h3 className="text-base leading-snug font-[560] tracking-[-0.01em] text-zinc-100 [font-stretch:104%]">
            <Org name={education.institution} website={education.website} />
          </h3>
          <p className="text-sm text-zinc-400">
            {education.degree}
            {education.alias ? ` (${education.alias})` : ""}
          </p>
        </div>
      </div>
      {education.location.regency && (
        <p className="type-meta mt-3 text-zinc-500">
          {education.location.regency}, {education.location.province} {education.location.flag}
        </p>
      )}
      <Bullets items={education.achievements} />
    </Entry>
  );
}

export function AwardEntry({ award }: { award: Award }) {
  return (
    <Entry when={monthYearText(award.issued)}>
      <div className="flex items-center gap-3">
        <OrgMark logo={award.logo} name={award.institution} />
        <div className="min-w-0">
          <h3 className="text-base leading-snug font-[560] tracking-[-0.01em] text-zinc-100 [font-stretch:104%]">{award.title}</h3>
          <p className="text-sm text-zinc-400">
            <Org name={award.institution} website={award.website} />
          </p>
        </div>
      </div>
      {award.description && (
        <p className="mt-2 text-sm leading-relaxed text-pretty text-zinc-400">{award.description}</p>
      )}
      {award.credential_url && <CredentialLink href={award.credential_url} />}
    </Entry>
  );
}

export function CertificationEntry({ certification }: { certification: Certification }) {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-1 py-4 md:grid-cols-[9rem_1fr]">
      <div className="type-meta pt-1 text-zinc-500">{monthYearText(certification.issued)}</div>
      <div className="flex min-w-0 items-start gap-3">
        <OrgMark logo={certification.logo} name={certification.institution} className="h-7 w-7" />
        <div className="min-w-0">
          <h3 className="text-base font-[560] text-balance text-zinc-100">{certification.title}</h3>
          <p className="text-sm text-zinc-500">
            <Org name={certification.institution} website={certification.website} />
          </p>
          <Bullets items={certification.achievements} />
          {certification.credential_url && <CredentialLink href={certification.credential_url} />}
        </div>
      </div>
    </div>
  );
}

function CredentialLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(LINK, "mt-3 inline-flex items-center gap-1 text-sm text-zinc-400")}
    >
      <LineText>View credential</LineText>
      <ArrowFx direction="up-right" className="h-3.5 w-3.5" />
    </a>
  );
}

/*
 * Keyed on the slug, never the label: the label is editable from the admin, so
 * keying on it meant renaming "In Progress" silently dropped the colour.
 */
const OUTCOME_DOT: Record<string, string> = {
  "in-progress": "bg-blue-400",
  accepted: "bg-emerald-400",
  rejected: "bg-red-400",
  ghosted: "bg-yellow-400",
  applied: "bg-zinc-400",
};

export function ApplicationEntry({ application }: { application: Application }) {
  const facts = [
    application.employment_type,
    application.location_type,
    application.location,
    application.salary_range,
    application.applied_via && `via ${application.applied_via}`,
  ].filter(Boolean) as string[];

  return (
    <div className="py-4">
      <Disclosure>
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h3 className="text-base font-[560] text-zinc-100">
              {application.position}
              <span className="font-normal text-zinc-500"> at {application.company_name}</span>
            </h3>
            {facts.length > 0 && <p className="type-meta mt-1.5 text-zinc-500">{facts.join(" · ")}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <span className="type-meta inline-flex items-center gap-1.5 text-zinc-300">
              <span
                aria-hidden="true"
                className={cn("h-1.5 w-1.5 rounded-full", OUTCOME_DOT[application.status_slug] ?? "bg-zinc-400")}
              />
              {application.status}
            </span>
            {application.journey.length > 0 && <DisclosureButton />}
          </div>
        </div>

        {application.journey.length > 0 && (
          <DisclosurePanel className="pt-5">
            <div className="custom-scroll max-h-[60vh] overflow-auto">
              <table className="w-full table-auto text-sm">
                <thead>
                  <tr>
                    {["Timestamp", "Step", "Details", "Notes"].map((heading) => (
                      <th key={heading} className="type-meta py-2.5 pr-4 text-left font-normal text-zinc-500">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {application.journey.map((step, index) => (
                    <tr key={index}>
                      <td className="type-meta py-2.5 pr-4 align-top whitespace-nowrap">
                        {step.timestamp ? (
                          <>
                            <span className="text-zinc-400">{stepDate(step.timestamp)}</span>
                            <br />
                            <span className="text-zinc-600">{stepTime(step.timestamp)}</span>
                          </>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 align-top text-zinc-100">{step.title}</td>
                      <td className="py-2.5 pr-4 align-top break-words text-zinc-400">{step.details}</td>
                      <td className="py-2.5 align-top text-xs break-words text-zinc-500">{step.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DisclosurePanel>
        )}

        {application.lessons_learned && (
          <p className="mt-2 font-serif text-sm leading-relaxed text-pretty text-zinc-400">
            <span className="font-sans text-zinc-200">Lessons learned:</span> {application.lessons_learned}
          </p>
        )}
      </Disclosure>
    </div>
  );
}

function stepDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function stepTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Jakarta",
  }).format(date);
}
