import { asc, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/lib/db/client";
import {
  application,
  applicationSource,
  applicationStatus,
  applicationStep,
  award,
  category,
  certification,
  certificationAchievement,
  education,
  educationAchievement,
  employmentType,
  experience,
  experienceTask,
  location,
  mediaAsset,
  organization,
  profile,
  profileLink,
  profileSkillHighlight,
  skill,
  workMode,
} from "@/lib/db/app-schema";
import { assetUrl } from "@/lib/storage/media";

import { isWorkingHours, isoMonth, monthYear, type MonthYear } from "./format";
import { locationLabel } from "./location";
import { TAGS } from "./tags";

/**
 * About data.
 *
 * The returned shape is deliberately stable: flattened keys, nested `location`
 * / `social_media` / `cv` objects, and `{month, year}` pairs alongside their
 * `*_iso` forms. It feeds the page components *and* the JSON-LD generator, so a
 * renamed key is a silently missing structured-data property rather than a
 * compile error.
 *
 * What changed underneath is where each of those keys comes from. A profile
 * carried eight `social_*` columns, three `cv_*` columns and six `location_*`
 * columns; an experience repeated its location as free text; a skill named its
 * category with a string. Those are rows now -- `profile_link` scoped by kind,
 * `location`, `category` -- so adding a ninth social platform is an insert
 * rather than a migration, and "Boyolali" is one row that several records point
 * at rather than a string spelled slightly differently in each.
 *
 * The grouping that turns those rows back into the flat shapes happens here,
 * which is the price of the change and is paid once per cached read.
 */

/**
 * Ordered lists, keyed by the child row's `kind`.
 *
 * `profile_link` holds the social, CV and donate lists in one table, and the
 * `*_achievement` tables hold one list each. Both arrive as rows in order and
 * leave as arrays.
 */
function byKind<T extends { kind: string }>(rows: T[]): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const row of rows) (groups[row.kind] ??= []).push(row);
  return groups;
}

/** `platform` -> `url`, for the link lists the payload exposes as an object. */
function urlsByPlatform(links: { platform: string; url: string }[]): Record<string, string> {
  return Object.fromEntries(links.map((link) => [link.platform, link.url]));
}

/** Child rows grouped under their parent's key. */
function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const bucket = groups.get(key(row));
    if (bucket) bucket.push(row);
    else groups.set(key(row), [row]);
  }
  return groups;
}

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
  is_open_to_work: boolean;
  is_hiring: boolean;
  is_sick: boolean;
  short_description: string;
  short_bio: string;
  short_cta: string;
  long_description: string;
  /**
   * The intro paragraphs, as the HTML the page renders.
   *
   * There was a `stories` array beside this: the same paragraphs as JSONB
   * blocks, each with a hand-typed `class` key. That is the shape
   * `lib/utils/sanitize.ts` exists to keep out of the database, and nothing
   * read it -- the page renders `stories_html` -- so it did not come across.
   */
  stories_html: string;
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
 * `is_active` -- whether the site owner is inside working hours right now.
 *
 * Kept out of `AboutData` on purpose. It is derived from the current Jakarta
 * clock, and under Cache Components *any* read of the clock inside a
 * prerendered tree makes the whole tree dynamic. Since the layout renders the
 * about payload on every page, folding this in would cost the entire site its
 * prerendering to compute a field that, as it turns out, nothing displays:
 * the green availability dot it fed was removed from the profile avatar, and a
 * search of the templates finds no other reader.
 *
 * It is still returned by `/api/about`, which is request-time anyway, so the
 * API contract is unchanged for anything consuming it.
 */
export type AboutDataWithStatus = AboutData & { is_active: boolean };

export async function getAboutDataWithStatus(): Promise<AboutDataWithStatus | null> {
  const data = await getAboutData();
  if (!data) return null;
  return { ...data, is_active: isWorkingHours() };
}

/** The cached about payload. Safe to call from a prerendered tree. */
export async function getAboutData(): Promise<AboutData | null> {
  "use cache";
  // Depends on `skill` as well as `profile`: the payload embeds highlighted
  // skill *names*, so renaming a Skill changes it even though no Profile row
  // was touched. The dependency map lives in `lib/data/tags.ts`.
  cacheTag(TAGS.profile, TAGS.skill);
  cacheLife("days");

  const [row] = await db
    .select({
      p: profile,
      city: location.city,
      region: location.region,
      country: location.country,
      flag: location.flag,
      storageKey: mediaAsset.storageKey,
      source: mediaAsset.source,
    })
    .from(profile)
    .leftJoin(location, eq(location.id, profile.locationId))
    .leftJoin(mediaAsset, eq(mediaAsset.id, profile.imageId))
    .limit(1);
  if (!row) return null;

  const { p } = row;

  const [links, highlights] = await Promise.all([
    // All three link lists in one query: they share a table and differ only by
    // `kind`, so asking three times would be three round trips for one read.
    db
      .select({ kind: profileLink.kind, platform: profileLink.platform, url: profileLink.url })
      .from(profileLink)
      .where(eq(profileLink.profileId, p.id))
      .orderBy(asc(profileLink.position)),
    // Read through the ordered join rows, never the bare M2M: the sequence is
    // editorial and becomes the JSON-LD `knowsAbout` array. Ordering by the
    // join's `position` column is the entire reason the through model exists.
    db
      .select({ name: skill.name })
      .from(profileSkillHighlight)
      .innerJoin(skill, eq(profileSkillHighlight.skillId, skill.id))
      .where(eq(profileSkillHighlight.profileId, p.id))
      .orderBy(asc(profileSkillHighlight.position)),
  ]);

  const grouped = byKind(links);
  const social = urlsByPlatform(grouped.social ?? []);
  const cv = urlsByPlatform(grouped.cv ?? []);

  return {
    name: p.name,
    first_name: p.firstName,
    last_name: p.lastName,
    username: p.username,
    aka: p.aka,
    image_url: assetUrl(row.storageKey ? { storageKey: row.storageKey, source: row.source ?? "storage" } : null),
    personal_website: p.personalWebsite,
    cv: { main: cv.main ?? "", latest: cv.latest ?? "", copy: cv.copy ?? "" },
    role: p.role,
    is_open_to_work: p.isOpenToWork,
    is_hiring: p.isHiring,
    is_sick: p.isSick,
    short_description: p.shortDescription,
    short_bio: p.shortBio,
    short_cta: p.shortCta,
    long_description: p.longDescription,
    stories_html: p.storiesHtml,
    location: {
      /*
       * `regency`/`province`/`prov` are the payload's names for what the
       * `location` row calls `city` and `region`. `prov` held an abbreviation
       * the data never actually abbreviated -- both columns read "Central Java"
       * -- so both keys read the region and the duplicate column is gone.
       */
      regency: row.city ?? "",
      residency: p.residency,
      province: row.region ?? "",
      prov: row.region ?? "",
      country: row.country ?? "",
      flag: row.flag ?? "",
    },
    social_media: {
      email: social.email ?? "",
      github: social.github ?? "",
      linkedin: social.linkedin ?? "",
      follow_linkedin: social.follow_linkedin ?? "",
      instagram: social.instagram ?? "",
      medium: social.medium ?? "",
      x: social.x ?? "",
      website: social.website ?? "",
    },
    donate: (grouped.donate ?? []).map(({ platform, url }) => ({ platform, url })),
    skills: highlights.map((h) => h.name),
  };
}

/**
 * An organisation's logo, joined once and resolved once.
 *
 * Four of these lists show the same organisations, and each used to carry the
 * storage key in its own row. The key lives on `media_asset` now and the logo
 * is a foreign key to it, so every one of them joins the same two tables.
 */
const ORG_LOGO = {
  storageKey: mediaAsset.storageKey,
  source: mediaAsset.source,
};

function logoUrl(row: { storageKey: string | null; source: string | null }): string {
  return assetUrl(row.storageKey ? { storageKey: row.storageKey, source: row.source ?? "storage" } : null);
}

export type Experience = {
  id: string;
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

  const [rows, tasks] = await Promise.all([
    db
      .select({
        e: experience,
        org: organization,
        employmentType: employmentType.label,
        workMode: workMode.label,
        city: location.city,
        region: location.region,
        country: location.country,
        flag: location.flag,
        ...ORG_LOGO,
      })
      .from(experience)
      .innerJoin(organization, eq(experience.organizationId, organization.id))
      .leftJoin(employmentType, eq(employmentType.id, experience.employmentTypeId))
      .leftJoin(workMode, eq(workMode.id, experience.workModeId))
      .leftJoin(location, eq(location.id, experience.locationId))
      .leftJoin(mediaAsset, eq(mediaAsset.id, organization.logoId))
      .orderBy(asc(experience.position)),
    // Responsibilities were a `jsonb` array on the row; they are rows now, so
    // they arrive separately and are grouped back under their experience.
    db
      .select({ experienceId: experienceTask.experienceId, body: experienceTask.body })
      .from(experienceTask)
      .orderBy(asc(experienceTask.position)),
  ]);

  const tasksFor = groupBy(tasks, (task) => task.experienceId);

  return rows
    .filter(({ e }) => !currentOnly || e.isCurrent)
    .map((row) => ({
      id: row.e.id,
      title: row.e.title,
      company: row.org.name,
      logo: logoUrl(row),
      period: {
        start: monthYear(row.e.periodStart),
        // A role with no end date is one you are still in.
        end: monthYear(row.e.periodEnd) ?? ("Present" as const),
        start_iso: isoMonth(row.e.periodStart),
        end_iso: isoMonth(row.e.periodEnd),
      },
      employment_type: row.employmentType ?? "",
      location_type: row.workMode ?? "",
      location: locationLabel(row),
      is_current: row.e.isCurrent,
      responsibilities: (tasksFor.get(row.e.id) ?? []).map((task) => task.body),
      website: row.org.website,
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

  const [rows, achievements] = await Promise.all([
    db
      .select({
        ed: education,
        org: organization,
        city: location.city,
        region: location.region,
        country: location.country,
        flag: location.flag,
        mapUrl: location.mapUrl,
        ...ORG_LOGO,
      })
      .from(education)
      .innerJoin(organization, eq(education.organizationId, organization.id))
      .leftJoin(location, eq(location.id, education.locationId))
      .leftJoin(mediaAsset, eq(mediaAsset.id, organization.logoId))
      // A uuid carries no insertion order, so the sequence somebody entered
      // these in has to be written down. `position` is where it is written.
      .orderBy(asc(education.position)),
    db
      .select({ educationId: educationAchievement.educationId, body: educationAchievement.body })
      .from(educationAchievement)
      .orderBy(asc(educationAchievement.position)),
  ]);

  const achievementsFor = groupBy(achievements, (row) => row.educationId);

  return rows
    .filter(({ ed }) => !lastOnly || ed.isLast)
    .map((row) => ({
      degree: row.ed.degree,
      institution: row.org.name,
      logo: logoUrl(row),
      is_last: row.ed.isLast,
      location: {
        regency: row.city ?? "",
        province: row.region ?? "",
        prov: row.region ?? "",
        country: row.country ?? "",
        flag: row.flag ?? "",
        map_url: row.mapUrl ?? "",
      },
      achievements: (achievementsFor.get(row.ed.id) ?? []).map((a) => a.body),
      alias: row.ed.alias,
      // Older rows only ever recorded a free-text year range, so `date` stays
      // null for them rather than claiming a precision the data never had.
      date: row.ed.dateStart
        ? { start: monthYear(row.ed.dateStart), end: monthYear(row.ed.dateEnd) }
        : null,
      years: row.ed.years,
      website: row.org.website,
    }));
}

export type Certification = {
  id: string;
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

  const [rows, achievements] = await Promise.all([
    db
      .select({ c: certification, org: organization, ...ORG_LOGO })
      .from(certification)
      .innerJoin(organization, eq(certification.organizationId, organization.id))
      .leftJoin(mediaAsset, eq(mediaAsset.id, organization.logoId))
      // Newest first. This read `order by id desc`, which on this data is the
      // same sequence -- the certifications were entered in date order -- but
      // says "most recently added" where the page means "most recent".
      .orderBy(desc(certification.issued)),
    db
      .select({
        certificationId: certificationAchievement.certificationId,
        body: certificationAchievement.body,
      })
      .from(certificationAchievement)
      .orderBy(asc(certificationAchievement.position)),
  ]);

  const achievementsFor = groupBy(achievements, (row) => row.certificationId);

  return rows.map((row) => ({
    id: row.c.id,
    title: row.c.title,
    credential_url: row.c.credentialUrl,
    issued: monthYear(row.c.issued),
    issued_iso: isoMonth(row.c.issued),
    institution: row.org.name,
    website: row.org.website,
    logo: logoUrl(row),
    is_featured: row.c.isFeatured,
    achievements: (achievementsFor.get(row.c.id) ?? []).map((a) => a.body),
  }));
}

/** Skills carrying an icon -- matches `Skill.objects.exclude(icon_svg="")`. */
export async function getSkills(): Promise<Skill[]> {
  "use cache";
  cacheTag(TAGS.skill);
  cacheLife("days");

  return (
    await db
      .select({ s: skill, category: category.label, ...SKILL_ICON })
      .from(skill)
      .leftJoin(category, eq(category.id, skill.categoryId))
      .innerJoin(mediaAsset, eq(mediaAsset.id, skill.iconId))
      .orderBy(asc(skill.position))
  ).map(toSkill);
}

/**
 * Every categorised skill, grouped and ordered by the categories themselves.
 *
 * The order was `SKILL_CATEGORY_ORDER`, a 25-entry array in this file that the
 * grouping walked to build the result. It is `category.position` now: the same
 * sequence, in the table it describes, editable from the admin and joinable.
 * A category outside the curated run keeps its place at the end, because it is
 * given a position past the list rather than at the front.
 */
export async function getSkillsByCategory(): Promise<Record<string, Skill[]>> {
  "use cache";
  cacheTag(TAGS.skill);
  cacheLife("days");

  const rows = await db
    .select({ s: skill, category: category.label, ...SKILL_ICON })
    .from(skill)
    .innerJoin(category, eq(category.id, skill.categoryId))
    .leftJoin(mediaAsset, eq(mediaAsset.id, skill.iconId))
    .orderBy(asc(category.position), asc(skill.position));

  const grouped: Record<string, Skill[]> = {};
  for (const row of rows) {
    if (!row.category) continue;
    (grouped[row.category] ??= []).push(toSkill(row));
  }
  return grouped;
}

/** A skill's icon, which is a `media_asset` rather than a stored path. */
const SKILL_ICON = {
  storageKey: mediaAsset.storageKey,
  source: mediaAsset.source,
};

function toSkill(row: {
  s: typeof skill.$inferSelect;
  category: string | null;
  storageKey: string | null;
  source: string | null;
}): Skill {
  return {
    name: row.s.name,
    description: row.s.description,
    icon_svg: logoUrl(row),
    category: row.category ?? "",
  };
}

export type Award = {
  id: string;
  title: string;
  credential_url: string;
  description: string;
  issued: MonthYear | null;
  issued_iso: string;
  institution: string;
  website: string;
  logo: string;
};

export async function getAwards(newestFirst = true): Promise<Award[]> {
  "use cache";
  cacheTag(TAGS.award, TAGS.organization);
  cacheLife("days");

  const rows = await db
    .select({ a: award, org: organization, ...ORG_LOGO })
    .from(award)
    .innerJoin(organization, eq(award.organizationId, organization.id))
    .leftJoin(mediaAsset, eq(mediaAsset.id, organization.logoId))
    // Was `id desc` / `id asc`, which on this data is exactly the issue date in
    // each direction. The parameter was named `sortById` for that reason and is
    // named for what it means now.
    .orderBy(newestFirst ? desc(award.issued) : asc(award.issued));

  return rows.map((row) => ({
    id: row.a.id,
    title: row.a.title,
    credential_url: row.a.credentialUrl,
    description: row.a.description,
    issued: monthYear(row.a.issued),
    issued_iso: isoMonth(row.a.issued),
    institution: row.org.name,
    website: row.org.website,
    logo: logoUrl(row),
  }));
}

export type JourneyStep = {
  timestamp: Date | null;
  title: string;
  details: string;
  notes: string;
};

export type Application = {
  id: string;
  /**
   * The status as written, and the slug it is written under.
   *
   * The card colours the outcome, and it keys that colour on `status_slug`
   * rather than on `status`: the label is editable from the admin, so keying
   * on it meant renaming "In Progress" to "In progress" silently dropped the
   * badge to the neutral fallback with nothing to report it.
   */
  status: string;
  status_slug: string;
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
    db
      .select({
        a: application,
        company: organization.name,
        status: applicationStatus.label,
        statusSlug: applicationStatus.slug,
        employmentType: employmentType.label,
        workMode: workMode.label,
        source: applicationSource.label,
        city: location.city,
        region: location.region,
        country: location.country,
        flag: location.flag,
      })
      .from(application)
      .innerJoin(organization, eq(organization.id, application.organizationId))
      .leftJoin(applicationStatus, eq(applicationStatus.id, application.statusId))
      .leftJoin(employmentType, eq(employmentType.id, application.employmentTypeId))
      .leftJoin(workMode, eq(workMode.id, application.workModeId))
      .leftJoin(applicationSource, eq(applicationSource.id, application.sourceId))
      .leftJoin(location, eq(location.id, application.locationId)),
    // Ordered in SQL, and the tiebreak is deliberate.
    //
    // Ordering by `occurred_at` alone leaves steps that share a timestamp in
    // whatever order Postgres happens to return them -- heap order, which is
    // not stable across a VACUUM or an UPDATE that moves a tuple. Nine of the
    // 59 multi-step applications are affected; application 50 has four steps
    // at 2025-10-03T16:16.
    //
    // `position` is what carries the intended order. A uuid carries none, so
    // there is nothing else to fall back on. `asc` is already NULLS LAST in
    // Postgres, so no raw SQL is needed here.
    db
      .select()
      .from(applicationStep)
      .orderBy(asc(applicationStep.occurredAt), asc(applicationStep.position)),
  ]);

  const byApplication = new Map<string, JourneyStep[]>();
  for (const step of steps) {
    const entry: JourneyStep = {
      timestamp: step.occurredAt ? new Date(step.occurredAt) : null,
      title: step.title,
      details: step.details,
      notes: step.notes,
    };
    const bucket = byApplication.get(step.applicationId);
    if (bucket) bucket.push(entry);
    else byApplication.set(step.applicationId, [entry]);
  }

  const result: Application[] = apps.map((row) => ({
    id: row.a.id,
    status: row.status ?? "",
    status_slug: row.statusSlug ?? "",
    company_name: row.company,
    position: row.a.title,
    employment_type: row.employmentType ?? "",
    location_type: row.workMode ?? "",
    location: locationLabel(row),
    applied_via: row.source,
    salary_range: row.a.salaryRange,
    // Already ordered by the query above (timestamp asc nulls last, then
    // position), and the grouping loop below preserves that order, so there is
    // nothing left to sort here.
    journey: byApplication.get(row.a.id) ?? [],
    lessons_learned: row.a.lessonsLearned,
  }));

  /*
   * Newest activity first.
   *
   * The fallback for an application whose steps carry no timestamps at all was
   * `id * 1000` -- its serial key read as a unix timestamp. Odd, but it was
   * what the Python did, and it only ever ordered rows with no dates of their
   * own. A uuid cannot stand in for a number, so those rows now sort last
   * among themselves by company, which is at least a reason.
   */
  const latest = (app: Application) => {
    const times = app.journey
      .map((s) => s.timestamp?.getTime())
      .filter((t): t is number => t !== undefined);
    return times.length ? Math.max(...times) : null;
  };

  return result.sort((a, b) => {
    const left = latest(a);
    const right = latest(b);
    if (left !== null && right !== null) return right - left;
    if (left !== null) return -1;
    if (right !== null) return 1;
    return a.company_name.localeCompare(b.company_name);
  });
}
