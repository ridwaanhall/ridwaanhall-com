import Image from "next/image";

import {
  BulletList,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@/components/site/disclosure";
import type { Award, Certification, Education, Experience } from "@/lib/data/about";

/**
 * The cards on the about page.
 *
 * Education, awards and certifications shared a near-identical Django template
 * -- logo, title, a date pill on the right, the institution in italics, then
 * either an expandable achievement list or a credential link. That shape is
 * `CredentialCard` here; each caller supplies what differs.
 */

/** A logo, linked to the organisation's site when there is one. */
function OrgLogo({
  logo,
  name,
  website,
  rounded = "rounded-lg",
  fallback,
}: {
  logo: string;
  name: string;
  website: string;
  rounded?: string;
  fallback: React.ReactNode;
}) {
  const inner = logo ? (
    <Image
      src={logo}
      alt={`${name} logo`}
      width={150}
      height={150}
      className={`w-12 h-12 sm:w-14 sm:h-14 ${rounded} object-cover`}
    />
  ) : (
    fallback
  );

  if (!website) return inner;
  return (
    <a
      href={website}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Visit ${name}`}
      className="hover:scale-110 transition-transform duration-300"
    >
      {inner}
    </a>
  );
}

function ShieldIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function ExternalArrow({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

/**
 * A card's facts: when, what kind, where.
 *
 * One row shape for the whole about page. Experience, education and the
 * application cards were each spelling out their own -- different type size,
 * different gaps, different icon size -- for the same kind of line, so three
 * cards a reader sees one after another disagreed about what a fact looks like.
 * `ApplicationCard` imports these too; it is where the shape came from.
 *
 * The gaps are wider than the old `gap-4` because these carry no background:
 * each item ends where its text ends, and 16px ran them together into one line
 * of prose.
 */
export function MetaRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-400">{children}</div>;
}

export function MetaItem({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center">{children}</span>;
}

/**
 * When something happened, on the education, award and certification cards.
 *
 * A date is not a status. This used to be indigo text on an indigo gradient,
 * which put the same emphasis on "May 2024" as on the title beside it; it now
 * matches the "Show more" pill's neutral border and reads as the caption it is.
 */
function DatePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex flex-shrink-0 text-zinc-400 text-xs px-2 py-1 rounded-full border border-zinc-700 whitespace-nowrap">
      {children}
    </span>
  );
}

function Institution({ name, website }: { name: string; website: string }) {
  return (
    <p className="text-blue-200 mt-1 mb-2 sm:mb-3 italic text-xs sm:text-sm md:text-base">
      {website ? (
        <a
          className="text-indigo-300 hover:text-indigo-200 transition-colors duration-200 underline-offset-2 hover:underline"
          href={website}
          target="_blank"
          rel="noopener noreferrer"
        >
          {name}
        </a>
      ) : (
        name
      )}
    </p>
  );
}

function CredentialLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="toggle-pill group px-3 py-1.5 rounded-full"
    >
      <span>View Credential</span>
      <ExternalArrow className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-1.5 transition-transform group-hover:translate-x-1" />
    </a>
  );
}

// ---------------------------------------------------------------------------

export function ExperienceCard({ company, roles }: { company: string; roles: Experience[] }) {
  const first = roles[0];

  return (
    <div className="group">
      <div className="card-outline backdrop-blur-sm">
        <div className="p-4 border-b border-zinc-700/50">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center">
                <OrgLogo
                  logo={first.logo}
                  name={company}
                  website={first.website}
                  fallback={
                    <svg
                      className="w-8 h-8 text-zinc-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1"
                      />
                    </svg>
                  }
                />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold truncate">
                {first.website ? (
                  <a
                    href={first.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-400 transition-colors duration-200"
                  >
                    {company}
                    <ExternalArrow className="w-4 h-4 inline-block ml-1 opacity-60" />
                  </a>
                ) : (
                  company
                )}
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                {roles.length} position{roles.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-zinc-700">
          {roles.map((role) => (
            <Disclosure key={`${role.title}-${role.period.start_iso}`}>
              <div className="p-4">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-medium">{role.title}</h3>
                    {/* The same neutral treatment as the "Show more" pill it
                        sits beside. It marks which role is the current one,
                        which the dates below already say -- it does not need a
                        colour and a pulsing dot to say it a third time. */}
                    {role.is_current && (
                      <span className="pill-badge px-2.5 py-0.5 text-xs border border-zinc-700 text-zinc-400">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    <DisclosureButton />
                  </div>
                </div>

                <MetaRow>
                  <MetaItem>
                    <CalendarIcon />
                    {/* `period_start` is non-null in the model, but the manager
                        types it as nullable because `_month_year` returns null
                        for a missing date. Rendering an empty span beats a
                        crash if a row ever gets one. */}
                    {role.period.start
                      ? `${role.period.start.month} ${role.period.start.year}`
                      : ""}{" "}
                    -{" "}
                    {role.period.end === "Present"
                      ? "Present"
                      : `${role.period.end.month} ${role.period.end.year}`}
                  </MetaItem>
                  {role.employment_type && (
                    <MetaItem>
                      <BriefcaseIcon />
                      {role.employment_type}
                    </MetaItem>
                  )}
                  {(role.location_type || role.location) && (
                    <MetaItem>
                      <PinIcon />
                      {role.location_type}
                      {role.location_type && role.location ? " · " : ""}
                      {role.location}
                    </MetaItem>
                  )}
                </MetaRow>

                {/* Below the meta row and full width, which is where the
                    original put it -- not inside the header's right-hand
                    cell, where it would be squeezed beside the title. */}
                <DisclosurePanel>
                  <div className="ml-1">
                    <BulletList items={role.responsibilities} />
                  </div>
                </DisclosurePanel>
              </div>
            </Disclosure>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * One qualification.
 *
 * Built on the application card's anatomy, which is what a reader meets one tab
 * over: the organisation named first with the specific thing in italics beside
 * it, a chip at the right-hand end of that row, and the facts and the "Show
 * more" pill sharing the line below. The logo stays -- it is the one thing an
 * application has no equivalent for, and it anchors the row the way the company
 * header does on an experience card.
 */
export function EducationCard({ education }: { education: Education }) {
  const period = education.years
    ? education.years
    : education.date
      ? `${education.date.start?.month} ${education.date.start?.year} - ${
          education.date.end ? `${education.date.end.month} ${education.date.end.year}` : "Present"
        }`
      : "";

  const place = education.location.regency ? (
    <MetaRow>
      <MetaItem>
        <PinIcon />
        {education.location.regency}, {education.location.province} {education.location.flag}
      </MetaItem>
    </MetaRow>
  ) : (
    // Keeps the "Show more" pill at the right-hand end when there is no place
    // to show -- the same stand-in the application card uses for its facts.
    <div />
  );

  return (
    <div className="card-outline">
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center backdrop-blur-sm transform transition-all duration-300 hover:scale-105">
              <OrgLogo
                logo={education.logo}
                name={education.institution}
                website={education.website}
                rounded="rounded-full"
                fallback={<ShieldIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-indigo-400" />}
              />
            </div>
          </div>

          <div className="flex-grow w-full min-w-0">
            <div className="flex flex-row items-center justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
              <h3 className="text-base sm:text-lg font-medium text-zinc-300 break-words">
                {education.website ? (
                  <a href={education.website} target="_blank" rel="noopener noreferrer">
                    {education.institution}
                  </a>
                ) : (
                  education.institution
                )}{" "}
                <span className="text-blue-200 italic font-medium text-xs sm:text-sm">
                  &mdash; {education.degree}
                </span>
              </h3>
              <DatePill>{period}</DatePill>
            </div>

            {education.achievements.length > 0 ? (
              <Disclosure>
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  {place}
                  <div className="flex-shrink-0">
                    <DisclosureButton className="toggle-pill cursor-pointer px-2 py-1 rounded-full" />
                  </div>
                </div>
                {/* The original's `mt-1` sat on the panel element, where it kept
                    its 4px while collapsed; here it moves inside so a closed card
                    is exactly the height it was. `pt-1`, not `mt-1`: the list
                    below carries `mt-2`, and two adjacent top margins collapse to
                    the larger of the two -- which would swallow the 4px. */}
                <DisclosurePanel>
                  <div className="pt-1">
                    <BulletList items={education.achievements} />
                  </div>
                </DisclosurePanel>
              </Disclosure>
            ) : (
              <div className="mt-2">{place}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AwardCard({ award }: { award: Award }) {
  return (
    <div className="card-outline p-2 sm:p-3 md:p-4 backdrop-blur-sm">
      <div className="flex items-start gap-3 md:gap-4">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center backdrop-blur-sm transform transition-all duration-300 hover:scale-105">
            <OrgLogo
              logo={award.logo}
              name={award.institution}
              website={award.website}
              fallback={<ShieldIcon className="w-12 h-12 sm:w-14 sm:h-14 text-indigo-400" />}
            />
          </div>
        </div>

        <div className="flex-grow">
          <div className="flex flex-wrap items-start justify-between w-full gap-2">
            <h3 className="text-base sm:text-lg md:text-xl font-medium text-zinc-300 break-words flex-1">
              {award.title}
            </h3>
            <DatePill>
              {award.issued?.month} {award.issued?.year}
            </DatePill>
          </div>

          <Institution name={award.institution} website={award.website} />

          {award.description && (
            <p className="text-xs sm:text-sm md:text-base mb-2 sm:mb-3">{award.description}</p>
          )}

          {award.credential_url && (
            <div className="mt-1 sm:mt-2 flex flex-wrap gap-2">
              <CredentialLink href={award.credential_url} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CertificationCard({ certification }: { certification: Certification }) {
  return (
    <div className="card-outline p-2 sm:p-3 md:p-4 backdrop-blur-sm">
      <div className="flex items-start gap-3 md:gap-4">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center backdrop-blur-sm transform transition-all duration-300 hover:scale-105">
            <OrgLogo
              logo={certification.logo}
              name={certification.institution}
              website={certification.website}
              fallback={<ShieldIcon className="w-12 h-12 sm:w-14 sm:h-14 text-indigo-400" />}
            />
          </div>
        </div>

        <div className="flex-grow">
          <div className="flex flex-wrap items-start justify-between w-full gap-2">
            <h3 className="text-base sm:text-lg md:text-xl font-medium text-zinc-300 break-words flex-1">
              {certification.title}
            </h3>
            <DatePill>
              {certification.issued?.month} {certification.issued?.year}
            </DatePill>
          </div>

          <Institution name={certification.institution} website={certification.website} />

          <Disclosure>
            <div className="mt-1 sm:mt-2 flex flex-wrap gap-2">
              {certification.achievements.length > 0 && <DisclosureButton />}
              {certification.credential_url && (
                <CredentialLink href={certification.credential_url} />
              )}
            </div>
            {/* `pt-1` rather than `mt-1`, for the reason given on the
                education card above. */}
            {certification.achievements.length > 0 && (
              <DisclosurePanel>
                <div className="pt-1">
                  <BulletList items={certification.achievements} />
                </div>
              </DisclosurePanel>
            )}
          </Disclosure>
        </div>
      </div>
    </div>
  );
}

// --- shared icons ----------------------------------------------------------

function CalendarIcon() {
  return (
    <svg
      className="w-3 h-3 mr-1 text-zinc-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg
      className="w-3 h-3 mr-1 text-zinc-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function PinIcon({ className = "w-3 h-3 mr-1 text-zinc-400" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
