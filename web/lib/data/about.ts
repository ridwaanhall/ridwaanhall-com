import { asc, desc, eq, ne } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/lib/db/client";
import {
  aboutApplication,
  aboutAward,
  aboutCertification,
  aboutDonatelink,
  aboutEducation,
  aboutExperience,
  aboutJourneystep,
  aboutOrganization,
  aboutProfileskillhighlight,
  aboutSkill,
} from "@/lib/db/schema";
import { mediaUrl } from "@/lib/storage/media";

import { isWorkingHours, isoMonth, monthYear, type MonthYear } from "./format";
import { TAGS } from "./tags";

/**
 * About data.
 *
 * A port of apps/about/manager.py. The returned shapes are preserved exactly --
 * the same flattened keys, the same nested `location` / `social_media` / `cv`
 * objects, the same `{month, year}` pairs alongside their `*_iso` forms. They
 * feed the page components *and* the JSON-LD generator, so a renamed key is a
 * silently missing structured-data property rather than a compile error.
 */

/** Category display order, from apps/about/manager.py. */
export const SKILL_CATEGORY_ORDER = [
  "Languages", "Backend Frameworks", "Frontend Frameworks", "Styling & UI",
  "CMS & E-commerce", "Data Visualization", "Utilities & Auth", "Data Apps",
  "Automation & Scraping", "ML Frameworks", "ML Algorithms", "LLMs & AI Services",
  "Data Science", "Databases & ORM", "APIs & Services", "Cloud & DevOps",
  "Package Management", "PaaS", "Serverless", "Web Server", "Testing",
  "Version Control", "Editor & IDE", "Design", "Desktop",
] as const;

export type Skill = {
  name: string;
  description: string;
  icon_svg: string;
  category: string;
};

export type AboutData = {
  name: string;
  first_name: string;
  last_name: string;
  username: string;
  aka: string;
  image_url: string;
  personal_website: string;
  cv: { main: string; latest: string; copy: string };
  role: string;
  is_active: boolean;
  is_open_to_work: boolean;
  is_hiring: boolean;
  is_sick: boolean;
  short_description: string;
  short_bio: string;
  short_cta: string;
  long_description: string;
  stories: unknown[];
  location: {
    regency: string;
    residency: string;
    province: string;
    prov: string;
    country: string;
    flag: string;
  };
  social_media: {
    email: string;
    github: string;
    linkedin: string;
    follow_linkedin: string;
    instagram: string;
    medium: string;
    x: string;
    website: string;
  };
  donate: { platform: string; url: string }[];
  skills: string[];
};

/**
 * The about payload, with `is_active` recomputed on every read.
 *
 * The split matters: everything else is cached, but `is_active` is derived from
 * the current Jakarta time, so serving it from the cache would freeze the
 * availability indicator in the sidebar.
 */
export async function getAboutData(): Promise<AboutData | null> {
  const data = await getCachedAboutData();
  if (!data) return null;
  return { ...data, is_active: isWorkingHours() };
}

async function getCachedAboutData(): Promise<AboutData | null> {
  "use cache";
  // Depends on `skill` as well as `profile`: the payload embeds highlighted
  // skill *names*, so renaming a Skill changes it even though no Profile row
  // was touched. Carried over from ENTRY_DEPENDENCIES in apps/core/cache.py.
  cacheTag(TAGS.profile, TAGS.skill);
  cacheLife("days");

  const profile = await db.query.aboutProfile.findFirst();
  if (!profile) return null;

  const [donations, highlights] = await Promise.all([
    db
      .select({ platform: aboutDonatelink.platform, url: aboutDonatelink.url })
      .from(aboutDonatelink)
      .where(eq(aboutDonatelink.profileId, profile.id))
      .orderBy(asc(aboutDonatelink.order)),
    // Read through the ordered join rows, never the bare M2M: the sequence is
    // editorial and becomes the JSON-LD `knowsAbout` array. Ordering by the
    // join's `order` column is the entire reason the through model exists.
    db
      .select({ name: aboutSkill.name })
      .from(aboutProfileskillhighlight)
      .innerJoin(aboutSkill, eq(aboutProfileskillhighlight.skillId, aboutSkill.id))
      .where(eq(aboutProfileskillhighlight.profileId, profile.id))
      .orderBy(asc(aboutProfileskillhighlight.order)),
  ]);

  return {
    name: profile.name,
    first_name: profile.firstName,
    last_name: profile.lastName,
    username: profile.username,
    aka: profile.aka,
    image_url: mediaUrl(profile.image),
    personal_website: profile.personalWebsite,
    cv: { main: profile.cvMain, latest: profile.cvLatest, copy: profile.cvCopy },
    role: profile.role,
    is_active: false, // replaced per request by getAboutData()
    is_open_to_work: profile.isOpenToWork,
    is_hiring: profile.isHiring,
    is_sick: profile.isSick,
    short_description: profile.shortDescription,
    short_bio: profile.shortBio,
    short_cta: profile.shortCta,
    long_description: profile.longDescription,
    stories: (profile.stories ?? []) as unknown[],
    location: {
      regency: profile.locationRegency,
      residency: profile.locationResidency,
      province: profile.locationProvince,
      prov: profile.locationProv,
      country: profile.locationCountry,
      flag: profile.locationFlag,
    },
    social_media: {
      email: profile.socialEmail,
      github: profile.socialGithub,
      linkedin: profile.socialLinkedin,
      follow_linkedin: profile.socialFollowLinkedin,
      instagram: profile.socialInstagram,
      medium: profile.socialMedium,
      x: profile.socialX,
      website: profile.socialWebsite,
    },
    donate: donations,
    skills: highlights.map((h) => h.name),
  };
}

export type Experience = {
  id: number;
  title: string;
  company: string;
  logo: string;
  period: {
    start: MonthYear | null;
    end: MonthYear | "Present";
    start_iso: string;
    end_iso: string;
  };
  employment_type: string;
  location_type: string;
  location: string;
  is_current: boolean;
  responsibilities: string[];
  website: string;
};

export async function getExperiences(currentOnly = false): Promise<Experience[]> {
  "use cache";
  cacheTag(TAGS.experience, TAGS.organization);
  cacheLife("days");

  const rows = await db
    .select({ e: aboutExperience, org: aboutOrganization })
    .from(aboutExperience)
    .innerJoin(aboutOrganization, eq(aboutExperience.organizationId, aboutOrganization.id))
    .orderBy(asc(aboutExperience.sortOrder));

  return rows
    .filter(({ e }) => !currentOnly || e.isCurrent)
    .map(({ e, org }) => ({
      id: e.id,
      title: e.title,
      company: org.name,
      logo: mediaUrl(org.logo),
      period: {
        start: monthYear(e.periodStart),
        // A role with no end date is one you are still in.
        end: monthYear(e.periodEnd) ?? ("Present" as const),
        start_iso: isoMonth(e.periodStart),
        end_iso: isoMonth(e.periodEnd),
      },
      employment_type: e.employmentType,
      location_type: e.locationType,
      location: e.location,
      is_current: e.isCurrent,
      responsibilities: (e.responsibilities ?? []) as string[],
      website: org.website,
    }));
}

export type Education = {
  degree: string;
  institution: string;
  logo: string;
  is_last: boolean;
  location: {
    regency: string;
    province: string;
    prov: string;
    country: string;
    flag: string;
    map_url: string;
  };
  achievements: string[];
  alias: string | null;
  date: { start: MonthYear | null; end: MonthYear | null } | null;
  years: string | null;
  website: string;
};

export async function getEducation(lastOnly = false): Promise<Education[]> {
  "use cache";
  cacheTag(TAGS.education, TAGS.organization);
  cacheLife("days");

  const rows = await db
    .select({ ed: aboutEducation, org: aboutOrganization })
    .from(aboutEducation)
    .innerJoin(aboutOrganization, eq(aboutEducation.organizationId, aboutOrganization.id))
    .orderBy(asc(aboutEducation.id));

  return rows
    .filter(({ ed }) => !lastOnly || ed.isLast)
    .map(({ ed, org }) => ({
      degree: ed.degree,
      institution: org.name,
      logo: mediaUrl(org.logo),
      is_last: ed.isLast,
      location: {
        regency: ed.locationRegency,
        province: ed.locationProvince,
        prov: ed.locationProv,
        country: ed.locationCountry,
        flag: ed.locationFlag,
        map_url: ed.locationMapUrl,
      },
      achievements: (ed.achievements ?? []) as string[],
      alias: ed.alias,
      // Older rows only ever recorded a free-text year range, so `date` stays
      // null for them rather than claiming a precision the data never had.
      date: ed.dateStart ? { start: monthYear(ed.dateStart), end: monthYear(ed.dateEnd) } : null,
      years: ed.years,
      website: org.website,
    }));
}

export type Certification = {
  id: number;
  title: string;
  credential_url: string;
  issued: MonthYear | null;
  issued_iso: string;
  institution: string;
  website: string;
  logo: string;
  is_featured: boolean;
  achievements: string[];
};

export async function getCertifications(): Promise<Certification[]> {
  "use cache";
  cacheTag(TAGS.certification, TAGS.organization);
  cacheLife("days");

  const rows = await db
    .select({ c: aboutCertification, org: aboutOrganization })
    .from(aboutCertification)
    .innerJoin(aboutOrganization, eq(aboutCertification.organizationId, aboutOrganization.id))
    .orderBy(desc(aboutCertification.id));

  return rows.map(({ c, org }) => ({
    id: c.id,
    title: c.title,
    credential_url: c.credentialUrl,
    issued: monthYear(c.issued),
    issued_iso: isoMonth(c.issued),
    institution: org.name,
    website: org.website,
    logo: mediaUrl(org.logo),
    is_featured: c.isFeatured,
    achievements: (c.achievements ?? []) as string[],
  }));
}

/** Skills carrying an icon -- matches `Skill.objects.exclude(icon_svg="")`. */
export async function getSkills(): Promise<Skill[]> {
  "use cache";
  cacheTag(TAGS.skill);
  cacheLife("days");

  const rows = await db
    .select()
    .from(aboutSkill)
    .where(ne(aboutSkill.iconSvg, ""))
    .orderBy(asc(aboutSkill.id));

  return rows.map(toSkill);
}

/** Every categorised skill, grouped and ordered by SKILL_CATEGORY_ORDER. */
export async function getSkillsByCategory(): Promise<Record<string, Skill[]>> {
  "use cache";
  cacheTag(TAGS.skill);
  cacheLife("days");

  const rows = await db.select().from(aboutSkill).orderBy(asc(aboutSkill.id));

  const grouped = new Map<string, Skill[]>();
  for (const row of rows) {
    if (!row.category) continue;
    const bucket = grouped.get(row.category);
    if (bucket) bucket.push(toSkill(row));
    else grouped.set(row.category, [toSkill(row)]);
  }

  const ordered: Record<string, Skill[]> = {};
  for (const category of SKILL_CATEGORY_ORDER) {
    const skills = grouped.get(category);
    if (skills) {
      ordered[category] = skills;
      grouped.delete(category);
    }
  }
  // Anything outside the curated order keeps its natural position at the end.
  for (const [category, skills] of grouped) ordered[category] = skills;
  return ordered;
}

function toSkill(row: typeof aboutSkill.$inferSelect): Skill {
  return {
    name: row.name,
    description: row.description,
    icon_svg: row.iconSvg,
    category: row.category,
  };
}

export type Award = {
  id: number;
  title: string;
  credential_url: string;
  description: string;
  issued: MonthYear | null;
  issued_iso: string;
  institution: string;
  website: string;
  logo: string;
};

export async function getAwards(sortById = true): Promise<Award[]> {
  "use cache";
  cacheTag(TAGS.award, TAGS.organization);
  cacheLife("days");

  const rows = await db
    .select({ a: aboutAward, org: aboutOrganization })
    .from(aboutAward)
    .innerJoin(aboutOrganization, eq(aboutAward.organizationId, aboutOrganization.id))
    .orderBy(sortById ? desc(aboutAward.id) : asc(aboutAward.id));

  return rows.map(({ a, org }) => ({
    id: a.id,
    title: a.title,
    credential_url: a.credentialUrl,
    description: a.description,
    issued: monthYear(a.issued),
    issued_iso: isoMonth(a.issued),
    institution: org.name,
    website: org.website,
    logo: mediaUrl(org.logo),
  }));
}

export type JourneyStep = {
  timestamp: Date | null;
  title: string;
  details: string;
  notes: string;
};

export type Application = {
  id: number;
  status: string;
  company_name: string;
  position: string;
  employment_type: string;
  location_type: string;
  location: string;
  applied_via: string | null;
  salary_range: string | null;
  journey: JourneyStep[];
  lessons_learned: string;
};

export async function getApplications(): Promise<Application[]> {
  "use cache";
  cacheTag(TAGS.application);
  cacheLife("days");

  const [apps, steps] = await Promise.all([
    db.select().from(aboutApplication).orderBy(desc(aboutApplication.id)),
    // Ordered in SQL, and the tiebreak is deliberate.
    //
    // Django ordered these by `timestamp` alone (JourneyStep.Meta.ordering)
    // and then re-sorted in Python with a stable sort, which meant steps
    // sharing a timestamp came out in whatever order Postgres happened to
    // return them -- heap order, which is not stable across a VACUUM or an
    // UPDATE that moves a tuple. Nine of the 59 multi-step applications are
    // affected; application 50 has four steps at 2025-10-03T16:16 and Django
    // returns them as ids 44, 43, 42, 45.
    //
    // Adding `id` as the tiebreak keeps insertion order for simultaneous
    // events, which is both meaningful and reproducible. This is a
    // *behavioural* difference from Django, and the only intentional one in
    // the data layer.
    // `asc` is already NULLS LAST in Postgres, which is what Django's
    // `Meta.ordering = ["timestamp"]` produced, so no raw SQL is needed here.
    db
      .select()
      .from(aboutJourneystep)
      .orderBy(asc(aboutJourneystep.timestamp), asc(aboutJourneystep.id)),
  ]);

  const byApplication = new Map<number, JourneyStep[]>();
  for (const step of steps) {
    const entry: JourneyStep = {
      timestamp: step.timestamp ? new Date(step.timestamp) : null,
      title: step.title,
      details: step.details,
      notes: step.notes,
    };
    const bucket = byApplication.get(step.applicationId);
    if (bucket) bucket.push(entry);
    else byApplication.set(step.applicationId, [entry]);
  }

  const result: Application[] = apps.map((app) => ({
    id: app.id,
    status: app.status,
    company_name: app.companyName,
    position: app.position,
    employment_type: app.employmentType,
    location_type: app.locationType,
    location: app.location,
    applied_via: app.appliedVia,
    salary_range: app.salaryRange,
    // Already ordered by the query above (timestamp asc nulls last, then id),
    // and the grouping loop below preserves that order, so there is nothing
    // left to sort here.
    journey: byApplication.get(app.id) ?? [],
    lessons_learned: app.lessonsLearned,
  }));

  // Newest activity first. An application whose steps carry no timestamps at
  // all falls back to its id read as a unix timestamp -- odd, but it is what
  // the Python did, and it only ever orders rows that have no dates of their
  // own to sort by.
  const latest = (app: Application) => {
    const times = app.journey
      .map((s) => s.timestamp?.getTime())
      .filter((t): t is number => t !== undefined);
    return times.length ? Math.max(...times) : app.id * 1000;
  };

  return result.sort((a, b) => latest(b) - latest(a));
}
