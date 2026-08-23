import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/lib/db/client";
import {
  employmentType,
  hiringListItem,
  hiringProfile,
  jobOpening,
  jobOpeningListItem,
  location,
  openToWorkListItem,
  openToWorkProfile,
  portfolioHighlight,
} from "@/lib/db/app-schema";

import { locationLabel } from "./location";
import { TAGS } from "./tags";

/**
 * The open-to-work and hiring payloads.
 *
 * Twelve `jsonb` arrays
 * held these lists -- `application_process`, `company_culture`,
 * `requirements_general`, `skills_required`, `languages` and the rest -- each a
 * column on the profile or the position. They are rows now, in three tables
 * that hold every list belonging to one parent and tell them apart by a `kind`.
 *
 * That is the trade this file pays for: a list arrives as rows and is grouped
 * back into arrays here, once, instead of every list being a column that only
 * one screen can edit and nothing can join against.
 */

/** Group `kind`-discriminated child rows into the arrays the page expects. */
function byKind(rows: { kind: string; body: string }[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const row of rows) (groups[row.kind] ??= []).push(row.body);
  return groups;
}

export type Position = {
  title: string;
  type: string;
  location: string;
  salary_range: string;
  experience_required: string;
  skills_required: string[];
  responsibilities: string[];
  benefits: string[];
};

export type HiringData = {
  company_name: string;
  company_description: string;
  website: string;
  hiring_status: string;
  positions: Position[];
  application_process: string[];
  company_culture: string[];
  requirements: { general: string[]; technical: string[] };
  contact_info: {
    email: string;
    application_email: string;
    response_time: string;
    interview_process: string;
  };
  additional_notes: string;
};

export async function getHiringData(): Promise<HiringData | null> {
  "use cache";
  cacheTag(TAGS.hiring);
  cacheLife("days");

  const profile = await db.select().from(hiringProfile).limit(1);
  const hp = profile[0];
  if (!hp) return null;

  /*
   * Three queries rather than one join. The openings and their list items are
   * a one-to-many inside a one-to-many, so joining would multiply each opening
   * by its skills and its responsibilities and its benefits at once -- and
   * there are two openings, so the round trips cost less than the untangling.
   */
  const [profileItems, openings] = await Promise.all([
    db
      .select({ kind: hiringListItem.kind, body: hiringListItem.body })
      .from(hiringListItem)
      .where(eq(hiringListItem.hiringProfileId, hp.id))
      .orderBy(asc(hiringListItem.kind), asc(hiringListItem.position)),
    db
      .select({
        id: jobOpening.id,
        title: jobOpening.title,
        salaryRange: jobOpening.salaryRange,
        experienceRequired: jobOpening.experienceRequired,
        type: employmentType.label,
        city: location.city,
        region: location.region,
        country: location.country,
        flag: location.flag,
      })
      .from(jobOpening)
      .leftJoin(employmentType, eq(employmentType.id, jobOpening.employmentTypeId))
      .leftJoin(location, eq(location.id, jobOpening.locationId))
      .where(eq(jobOpening.hiringProfileId, hp.id))
      .orderBy(asc(jobOpening.position), asc(jobOpening.title)),
  ]);

  const openingItems = await db
    .select({
      jobOpeningId: jobOpeningListItem.jobOpeningId,
      kind: jobOpeningListItem.kind,
      body: jobOpeningListItem.body,
    })
    .from(jobOpeningListItem)
    .orderBy(asc(jobOpeningListItem.kind), asc(jobOpeningListItem.position));

  const itemsFor = new Map<string, { kind: string; body: string }[]>();
  for (const item of openingItems) {
    const bucket = itemsFor.get(item.jobOpeningId);
    if (bucket) bucket.push(item);
    else itemsFor.set(item.jobOpeningId, [item]);
  }

  const lists = byKind(profileItems);

  return {
    company_name: hp.companyName,
    company_description: hp.companyDescription,
    website: hp.website,
    hiring_status: hp.hiringStatus,
    positions: openings.map((opening) => {
      const own = byKind(itemsFor.get(opening.id) ?? []);
      return {
        title: opening.title,
        type: opening.type ?? "",
        location: locationLabel(opening),
        salary_range: opening.salaryRange,
        experience_required: opening.experienceRequired,
        skills_required: own.skill ?? [],
        responsibilities: own.responsibility ?? [],
        benefits: own.benefit ?? [],
      };
    }),
    application_process: lists.process ?? [],
    company_culture: lists.culture ?? [],
    requirements: {
      general: lists.requirement_general ?? [],
      technical: lists.requirement_technical ?? [],
    },
    contact_info: {
      email: hp.contactEmail,
      application_email: hp.contactApplicationEmail,
      response_time: hp.contactResponseTime,
      interview_process: hp.contactInterviewProcess,
    },
    additional_notes: hp.additionalNotes,
  };
}

export type OpenToWorkData = {
  status: string;
  availability: string;
  remote: boolean;
  relocation: boolean;
  type: string[];
  preferred_roles: string[];
  skills_highlight: string[];
  show_all_tools_skills: boolean;
  experience_level: string;
  salary_expectation: string;
  notice_period: string;
  work_authorization: string;
  languages: string[];
  preferred_locations: string[];
  location_types: string[];
  remote_locations: string[];
  portfolio_highlights: { title: string; description: string }[];
  contact_preference: string;
  interview_availability: string;
  additional_notes: string;
};

export async function getOpenToWorkData(): Promise<OpenToWorkData | null> {
  "use cache";
  cacheTag(TAGS.opentowork);
  cacheLife("days");

  const profile = await db.select().from(openToWorkProfile).limit(1);
  const op = profile[0];
  if (!op) return null;

  const [items, highlights] = await Promise.all([
    db
      .select({ kind: openToWorkListItem.kind, body: openToWorkListItem.body })
      .from(openToWorkListItem)
      .where(eq(openToWorkListItem.openToWorkProfileId, op.id))
      .orderBy(asc(openToWorkListItem.kind), asc(openToWorkListItem.position)),
    db
      .select()
      .from(portfolioHighlight)
      .where(eq(portfolioHighlight.openToWorkProfileId, op.id))
      .orderBy(asc(portfolioHighlight.position), asc(portfolioHighlight.title)),
  ]);

  /*
   * The location lists read `body` rather than rebuilding from `location_id`.
   * Both are stored -- the id is what makes "Indonesia" here the same row as
   * "Indonesia" on an experience -- and the text is the string that was
   * written, so reading it is the shortest path to rendering it unchanged.
   */
  const lists = byKind(items);

  return {
    status: op.status,
    availability: op.availability,
    remote: op.remote,
    relocation: op.relocation,
    type: lists.employment_type ?? [],
    preferred_roles: lists.preferred_role ?? [],
    skills_highlight: lists.skill_highlight ?? [],
    show_all_tools_skills: op.showAllToolsSkills,
    experience_level: op.experienceLevel,
    salary_expectation: op.salaryExpectation,
    notice_period: op.noticePeriod,
    work_authorization: op.workAuthorization,
    languages: lists.language ?? [],
    preferred_locations: lists.preferred_location ?? [],
    location_types: lists.work_mode ?? [],
    remote_locations: lists.remote_location ?? [],
    portfolio_highlights: highlights.map((h) => ({ title: h.title, description: h.description })),
    contact_preference: op.contactPreference,
    interview_availability: op.interviewAvailability,
    additional_notes: op.additionalNotes,
  };
}
