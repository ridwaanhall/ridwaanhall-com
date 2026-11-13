import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { getAboutData, getCertifications, getEducation, getExperiences, getSkillsByCategory } from "@/lib/data/about";
import { getProjects, sortProjects } from "@/lib/data/content";
import { getOpenToWorkData } from "@/lib/data/openhire";
import { TAGS } from "@/lib/data/tags";

import { buildCv, type Cv } from "./select";

const label = (m: { month: string; year: number } | null | "Present") =>
  m === "Present" ? "Present" : m ? `${m.month.slice(0, 3)} ${m.year}` : "";

/** Every table the CV reads; the PDF route is cached against the same list. */
export const CV_TAGS = [TAGS.profile, TAGS.experience, TAGS.education, TAGS.certification, TAGS.skill, TAGS.project, TAGS.opentowork, TAGS.organization];

/**
 * The CV, chosen from the rows the About page shows.
 *
 * One read behind both of its formats, the PDF and the Markdown twin, so the
 * two cannot disagree about what is on it. Cached against the tag of every
 * table it reads: an edit in the admin produces a new CV on the next request,
 * and an unedited one is built once.
 */
export async function getCv(): Promise<{ cv: Cv; username: string } | null> {
  "use cache";
  cacheTag(...CV_TAGS);
  cacheLife("days");

  const [about, work, experiences, education, skills, projects, certifications] = await Promise.all([
    getAboutData(),
    getOpenToWorkData(),
    getExperiences(),
    getEducation(),
    getSkillsByCategory(),
    getProjects(),
    getCertifications(),
  ]);
  if (!about) return null;

  const cv = buildCv({
    name: about.name,
    username: about.username,
    email: about.social_media.email,
    location: [about.location.residency || about.location.regency, about.location.country].filter(Boolean).join(", "),
    roles: work?.preferred_roles ?? [about.role],
    availability: work?.availability.toLowerCase() ?? "",
    notes: work?.additional_notes ?? about.short_bio,
    longDescription: about.long_description,
    experiences: experiences.map((role) => ({
      title: role.title,
      company: role.company,
      start: label(role.period.start),
      end: role.period.end === "Present" ? "Present" : label(role.period.end),
      employmentType: role.employment_type,
      workMode: role.location_type,
      place: role.place,
      responsibilities: role.responsibilities,
    })),
    education: education.map((e) => ({
      degree: e.degree,
      institution: e.institution,
      years: e.years || [label(e.date?.start ?? null), label(e.date?.end ?? null)].filter(Boolean).join(" - "),
      achievements: e.achievements,
    })),
    skills: Object.entries(skills).map(([category, list]) => [category, list.map((skill) => skill.name)]),
    projects: sortProjects(projects)
      .filter((project) => project.is_featured)
      .map((project) => ({ title: project.title, headline: project.headline, stack: project.tech_stack.map((skill) => skill.name) })),
    certifications: certifications.map((cert) => ({
      title: cert.title,
      institution: cert.institution,
      year: cert.issued?.year ?? null,
      // From the ISO form, `YYYY-MM`: the display pair carries "Jan", and a
      // lookup against full names put every certificate at month -1, so
      // certificates within a year were never ordered by month.
      month: cert.issued_iso ? Number(cert.issued_iso.slice(5, 7)) : 0,
    })),
  });

  return { cv, username: about.username };
}
