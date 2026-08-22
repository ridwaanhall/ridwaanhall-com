import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/lib/db/client";
import {
  openhireHiringprofile,
  openhireOpentoworkprofile,
  openhirePortfoliohighlight,
  openhirePosition,
} from "@/lib/db/schema";

import { TAGS } from "./tags";

/** A port of apps/openhire/manager.py, preserving its dict shapes exactly. */

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

  const profile = await db.select().from(openhireHiringprofile).limit(1);
  const hp = profile[0];
  if (!hp) return null;

  const positions = await db
    .select()
    .from(openhirePosition)
    .where(eq(openhirePosition.hiringProfileId, hp.id))
    .orderBy(asc(openhirePosition.order), asc(openhirePosition.id));

  return {
    company_name: hp.companyName,
    company_description: hp.companyDescription,
    website: hp.website,
    hiring_status: hp.hiringStatus,
    positions: positions.map((p) => ({
      title: p.title,
      type: p.type,
      location: p.location,
      salary_range: p.salaryRange,
      experience_required: p.experienceRequired,
      skills_required: (p.skillsRequired ?? []) as string[],
      responsibilities: (p.responsibilities ?? []) as string[],
      benefits: (p.benefits ?? []) as string[],
    })),
    application_process: (hp.applicationProcess ?? []) as string[],
    company_culture: (hp.companyCulture ?? []) as string[],
    requirements: {
      general: (hp.requirementsGeneral ?? []) as string[],
      technical: (hp.requirementsTechnical ?? []) as string[],
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

  const profile = await db.select().from(openhireOpentoworkprofile).limit(1);
  const op = profile[0];
  if (!op) return null;

  const highlights = await db
    .select()
    .from(openhirePortfoliohighlight)
    .where(eq(openhirePortfoliohighlight.openToWorkProfileId, op.id))
    .orderBy(asc(openhirePortfoliohighlight.order), asc(openhirePortfoliohighlight.id));

  return {
    status: op.status,
    availability: op.availability,
    remote: op.remote,
    relocation: op.relocation,
    type: (op.type ?? []) as string[],
    preferred_roles: (op.preferredRoles ?? []) as string[],
    skills_highlight: (op.skillsHighlight ?? []) as string[],
    show_all_tools_skills: op.showAllToolsSkills,
    experience_level: op.experienceLevel,
    salary_expectation: op.salaryExpectation,
    notice_period: op.noticePeriod,
    work_authorization: op.workAuthorization,
    languages: (op.languages ?? []) as string[],
    preferred_locations: (op.preferredLocations ?? []) as string[],
    location_types: (op.locationTypes ?? []) as string[],
    remote_locations: (op.remoteLocations ?? []) as string[],
    portfolio_highlights: highlights.map((h) => ({ title: h.title, description: h.description })),
    contact_preference: op.contactPreference,
    interview_availability: op.interviewAvailability,
    additional_notes: op.additionalNotes,
  };
}
