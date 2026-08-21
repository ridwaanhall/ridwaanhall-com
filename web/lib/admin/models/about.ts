import type { PgColumn } from "drizzle-orm/pg-core";

import {
  APPLICATION_STATUS_CHOICES,
  EMPLOYMENT_TYPE_CHOICES,
  LOCATION_TYPE_CHOICES,
} from "@/lib/admin/choices";
import {
  aboutApplication,
  aboutAward,
  aboutCertification,
  aboutEducation,
  aboutExperience,
  aboutOrganization,
  aboutSkill,
} from "@/lib/db/schema";

import { countWhere, lookup } from "@/lib/admin/sql";

import type { AdminListModel } from "@/lib/admin/list";

/**
 * The seven `about` changelists, from `apps/about/admin.py`.
 *
 * Grouped in one module the way Django grouped them in one `admin.py`: four of
 * them display the same foreign key, and the subquery that fetches it belongs
 * beside all four rather than being retyped in four files.
 */

/**
 * The organisation's name, without a join.
 *
 * Django reached for `list_select_related` here, to stop the changelist issuing
 * a query per row. A correlated subquery is likewise one query and leaves a
 * single table in `FROM`, so ordering, filtering, counting and paging all
 * compose without join plumbing. There are 19 organisations and the lookup is by
 * primary key.
 */
const organizationName = (fk: PgColumn) =>
  lookup<string>(aboutOrganization.name, aboutOrganization.id, fk);

// --- Experience --------------------------------------------------------------

export type ExperienceRow = {
  id: number;
  title: string;
  organization: string;
  periodStart: string;
  periodEnd: string | null;
  sortOrder: number;
  isCurrent: boolean;
};

const experienceOrganization = organizationName(aboutExperience.organizationId);

export const experienceList: AdminListModel<ExperienceRow> = {
  key: "experience",
  from: aboutExperience,
  pk: aboutExperience.id,
  select: {
    id: aboutExperience.id,
    title: aboutExperience.title,
    organization: experienceOrganization,
    periodStart: aboutExperience.periodStart,
    periodEnd: aboutExperience.periodEnd,
    sortOrder: aboutExperience.sortOrder,
    isCurrent: aboutExperience.isCurrent,
  },
  columns: [
    { key: "title", label: "Title", sort: aboutExperience.title, value: (row) => row.title },
    {
      key: "organization",
      label: "Organization",
      kind: "muted",
      sort: experienceOrganization,
      value: (row) => row.organization,
    },
    {
      key: "period_start",
      label: "From",
      kind: "date",
      sort: aboutExperience.periodStart,
      value: (row) => row.periodStart,
    },
    // A null end date is the role still being held, which is what `is_current`
    // says beside it -- so it shows as a dash rather than being hidden.
    {
      key: "period_end",
      label: "To",
      kind: "date",
      sort: aboutExperience.periodEnd,
      value: (row) => row.periodEnd,
    },
    {
      key: "sort_order",
      label: "Order",
      kind: "number",
      sort: aboutExperience.sortOrder,
      value: (row) => row.sortOrder,
    },
    {
      key: "is_current",
      label: "Current",
      kind: "bool",
      sort: aboutExperience.isCurrent,
      value: (row) => row.isCurrent,
    },
  ],
  filters: [
    { key: "is_current", label: "Current", kind: "boolean", column: aboutExperience.isCurrent },
    {
      key: "employment_type",
      label: "Employment",
      kind: "choice",
      column: aboutExperience.employmentType,
      choices: EMPLOYMENT_TYPE_CHOICES,
    },
    {
      key: "location_type",
      label: "Arrangement",
      kind: "choice",
      column: aboutExperience.locationType,
      choices: LOCATION_TYPE_CHOICES,
    },
    { key: "period_start", label: "Started", kind: "date", column: aboutExperience.periodStart },
  ],
  search: {
    fields: [aboutExperience.title, experienceOrganization],
    placeholder: "Search title or organization",
  },
  // `ordering = ["sort_order"]` on the model, which is the sequence the about
  // page renders in -- editorial, not chronological.
  defaultSort: { key: "sort_order", dir: "asc" },
  rowId: (row) => row.id,
};

// --- Education ---------------------------------------------------------------

export type EducationRow = {
  id: number;
  degree: string;
  organization: string;
  years: string | null;
  dateStart: string | null;
  isLast: boolean;
};

const educationOrganization = organizationName(aboutEducation.organizationId);

export const educationList: AdminListModel<EducationRow> = {
  key: "education",
  from: aboutEducation,
  pk: aboutEducation.id,
  select: {
    id: aboutEducation.id,
    degree: aboutEducation.degree,
    organization: educationOrganization,
    years: aboutEducation.years,
    dateStart: aboutEducation.dateStart,
    isLast: aboutEducation.isLast,
  },
  columns: [
    { key: "degree", label: "Degree", sort: aboutEducation.degree, value: (row) => row.degree },
    {
      key: "organization",
      label: "Organization",
      kind: "muted",
      sort: educationOrganization,
      value: (row) => row.organization,
    },
    // Free text ("2021 - 2025"), not a date range -- stored as typed.
    { key: "years", label: "Years", kind: "muted", sort: aboutEducation.years, value: (row) => row.years },
    {
      key: "date_start",
      label: "Started",
      kind: "date",
      sort: aboutEducation.dateStart,
      value: (row) => row.dateStart,
    },
    {
      key: "is_last",
      label: "Latest",
      kind: "bool",
      sort: aboutEducation.isLast,
      value: (row) => row.isLast,
    },
    // `ordering = ["id"]` on the model, and `id` is not in `list_display`, so
    // the ordering had nothing to hang off. Naming it in `defaultSort` alone
    // would leave the list unsortable by the very thing it is sorted by, so it
    // gets a column of its own.
    { key: "id", label: "#", kind: "number", sort: aboutEducation.id, value: (row) => row.id },
  ],
  filters: [{ key: "is_last", label: "Latest", kind: "boolean", column: aboutEducation.isLast }],
  search: {
    fields: [aboutEducation.degree, educationOrganization],
    placeholder: "Search degree or organization",
  },
  defaultSort: { key: "id", dir: "asc" },
  rowId: (row) => row.id,
};

// --- Award -------------------------------------------------------------------

export type AwardRow = { id: number; title: string; organization: string; issued: string };

const awardOrganization = organizationName(aboutAward.organizationId);

export const awardList: AdminListModel<AwardRow> = {
  key: "award",
  from: aboutAward,
  pk: aboutAward.id,
  select: {
    id: aboutAward.id,
    title: aboutAward.title,
    organization: awardOrganization,
    issued: aboutAward.issued,
  },
  columns: [
    { key: "title", label: "Title", sort: aboutAward.title, value: (row) => row.title },
    {
      key: "organization",
      label: "Organization",
      kind: "muted",
      sort: awardOrganization,
      value: (row) => row.organization,
    },
    // The model's help_text says the day is ignored and only month and year are
    // shown on the site. The admin shows the stored value, day included, because
    // this is where it is corrected.
    { key: "issued", label: "Issued", kind: "date", sort: aboutAward.issued, value: (row) => row.issued },
  ],
  filters: [{ key: "issued", label: "Issued", kind: "date", column: aboutAward.issued }],
  search: { fields: [aboutAward.title, awardOrganization], placeholder: "Search title or organization" },
  // `ordering = ["-id"]` -- newest first.
  defaultSort: { key: "issued", dir: "desc" },
  rowId: (row) => row.id,
};

// --- Certification -----------------------------------------------------------

export type CertificationRow = {
  id: number;
  title: string;
  organization: string;
  isFeatured: boolean;
  issued: string;
};

const certificationOrganization = organizationName(aboutCertification.organizationId);

export const certificationList: AdminListModel<CertificationRow> = {
  key: "certification",
  from: aboutCertification,
  pk: aboutCertification.id,
  select: {
    id: aboutCertification.id,
    title: aboutCertification.title,
    organization: certificationOrganization,
    isFeatured: aboutCertification.isFeatured,
    issued: aboutCertification.issued,
  },
  columns: [
    { key: "title", label: "Title", sort: aboutCertification.title, value: (row) => row.title },
    {
      key: "organization",
      label: "Organization",
      kind: "muted",
      sort: certificationOrganization,
      value: (row) => row.organization,
    },
    {
      key: "is_featured",
      label: "Featured",
      kind: "bool",
      sort: aboutCertification.isFeatured,
      value: (row) => row.isFeatured,
    },
    {
      key: "issued",
      label: "Issued",
      kind: "date",
      sort: aboutCertification.issued,
      value: (row) => row.issued,
    },
  ],
  filters: [
    { key: "is_featured", label: "Featured", kind: "boolean", column: aboutCertification.isFeatured },
    { key: "issued", label: "Issued", kind: "date", column: aboutCertification.issued },
  ],
  search: {
    fields: [aboutCertification.title, certificationOrganization],
    placeholder: "Search title or organization",
  },
  defaultSort: { key: "issued", dir: "desc" },
  rowId: (row) => row.id,
};

// --- Skill -------------------------------------------------------------------

export type SkillRow = { id: number; name: string; slug: string; category: string };

export const skillList: AdminListModel<SkillRow> = {
  key: "skill",
  from: aboutSkill,
  pk: aboutSkill.id,
  select: {
    id: aboutSkill.id,
    name: aboutSkill.name,
    slug: aboutSkill.slug,
    category: aboutSkill.category,
  },
  columns: [
    { key: "name", label: "Name", sort: aboutSkill.name, value: (row) => row.name },
    { key: "slug", label: "Slug", kind: "code", sort: aboutSkill.slug, value: (row) => row.slug },
    { key: "category", label: "Category", kind: "muted", sort: aboutSkill.category, value: (row) => row.category },
  ],
  filters: [
    {
      key: "category",
      label: "Category",
      kind: "choice",
      column: aboutSkill.category,
      choices: "distinct",
    },
  ],
  search: { fields: [aboutSkill.name, aboutSkill.slug], placeholder: "Search name or slug" },
  // `ordering = ["id"]`, but a 101-row catalogue is looked up by name.
  defaultSort: { key: "name", dir: "asc" },
  rowId: (row) => row.id,
};

// --- Application -------------------------------------------------------------

export type ApplicationRow = {
  id: number;
  companyName: string;
  position: string;
  status: string;
  employmentType: string;
  locationType: string;
};

export const applicationList: AdminListModel<ApplicationRow> = {
  key: "application",
  from: aboutApplication,
  pk: aboutApplication.id,
  select: {
    id: aboutApplication.id,
    companyName: aboutApplication.companyName,
    position: aboutApplication.position,
    status: aboutApplication.status,
    employmentType: aboutApplication.employmentType,
    locationType: aboutApplication.locationType,
  },
  columns: [
    {
      key: "company_name",
      label: "Company",
      sort: aboutApplication.companyName,
      value: (row) => row.companyName,
    },
    { key: "position", label: "Position", sort: aboutApplication.position, value: (row) => row.position },
    { key: "status", label: "Status", kind: "muted", sort: aboutApplication.status, value: (row) => row.status },
    {
      key: "employment_type",
      label: "Employment",
      kind: "muted",
      sort: aboutApplication.employmentType,
      value: (row) => row.employmentType,
    },
    {
      key: "location_type",
      label: "Arrangement",
      kind: "muted",
      sort: aboutApplication.locationType,
      value: (row) => row.locationType,
    },
    { key: "id", label: "#", kind: "number", sort: aboutApplication.id, value: (row) => row.id },
  ],
  filters: [
    {
      key: "status",
      label: "Status",
      kind: "choice",
      column: aboutApplication.status,
      choices: APPLICATION_STATUS_CHOICES,
    },
    {
      key: "employment_type",
      label: "Employment",
      kind: "choice",
      column: aboutApplication.employmentType,
      choices: EMPLOYMENT_TYPE_CHOICES,
    },
    {
      key: "location_type",
      label: "Arrangement",
      kind: "choice",
      column: aboutApplication.locationType,
      choices: LOCATION_TYPE_CHOICES,
    },
  ],
  search: {
    fields: [aboutApplication.companyName, aboutApplication.position],
    placeholder: "Search company or position",
  },
  // `ordering = ["-id"]` -- most recently applied first. There is no date column
  // on this model, so the id is the only thing that carries the sequence.
  defaultSort: { key: "id", dir: "desc" },
  rowId: (row) => row.id,
};

// --- Organization ------------------------------------------------------------

export type OrganizationRow = {
  id: number;
  name: string;
  website: string;
  experiences: number;
  education: number;
  certifications: number;
  awards: number;
};

/**
 * How many rows point at this organisation, per relation.
 *
 * Django computed this in the changelist query too, and for a reason worth
 * keeping: calling `.count()` per relation inside `list_display` issued four
 * queries for every row -- 76 sequential round trips to Supabase for 19
 * organisations, which timed the admin page out with a 504 in production. It
 * also had to pass `distinct=True`, because four joins on the same row multiply
 * each other and an organisation with 6 experiences and 1 certification reported
 * 6 certifications. Correlated subqueries have neither problem: each counts its
 * own table, and no join exists to multiply.
 */
const usedBy = (fk: PgColumn) => countWhere(fk, aboutOrganization.id);

export const organizationList: AdminListModel<OrganizationRow> = {
  key: "organization",
  from: aboutOrganization,
  pk: aboutOrganization.id,
  select: {
    id: aboutOrganization.id,
    name: aboutOrganization.name,
    website: aboutOrganization.website,
    experiences: usedBy(aboutExperience.organizationId),
    education: usedBy(aboutEducation.organizationId),
    certifications: usedBy(aboutCertification.organizationId),
    awards: usedBy(aboutAward.organizationId),
  },
  columns: [
    { key: "name", label: "Name", sort: aboutOrganization.name, value: (row) => row.name },
    {
      key: "website",
      label: "Website",
      kind: "muted",
      sort: aboutOrganization.website,
      value: (row) => row.website,
    },
    {
      key: "used_by",
      label: "Used by",
      kind: "muted",
      // Composed from four counts, so there is nothing single to ORDER BY --
      // Django's changelist refused to sort on it for the same reason.
      value: (row) =>
        [
          [row.experiences, "experience"],
          [row.education, "education"],
          [row.certifications, "certification"],
          [row.awards, "award"],
        ]
          .filter(([count]) => Number(count) > 0)
          .map(([count, label]) => `${count} ${label}`)
          .join(", ") || "unused",
    },
  ],
  search: {
    fields: [aboutOrganization.name, aboutOrganization.website],
    placeholder: "Search name or website",
  },
  defaultSort: { key: "name", dir: "asc" },
  rowId: (row) => row.id,
};
