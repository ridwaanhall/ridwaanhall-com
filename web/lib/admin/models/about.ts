import type { PgColumn } from "drizzle-orm/pg-core";

import {
  APPLICATION_STATUS_CHOICES,
  APPLIED_VIA_CHOICES,
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

import type { AdminFormModel, FormField } from "@/lib/admin/form";
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

export const skillForm: AdminFormModel = {
  key: "skill",
  from: aboutSkill,
  pk: aboutSkill.id,
  label: (values) => String(values.name ?? "Skill"),
  fieldsets: [
    {
      fields: [
        { name: "name", column: aboutSkill.name, label: "Name", kind: "text", required: true, maxLength: 100 },
        {
          name: "slug",
          column: aboutSkill.slug,
          label: "Slug",
          kind: "slug",
          maxLength: 50,
          slugFrom: "name",
          help: "Left blank, this is derived from the name.",
        },
        {
          name: "category",
          column: aboutSkill.category,
          label: "Category",
          kind: "text",
          maxLength: 100,
          help: "Groups the skill on the about page. Reuse an existing one to join that group.",
        },
      ],
    },
    {
      title: "Presentation",
      fields: [
        {
          name: "iconSvg",
          column: aboutSkill.iconSvg,
          label: "Icon",
          kind: "text",
          maxLength: 500,
          // Deliberately `text` and not `url`: 78 of these are site-relative
          // paths under `/static/svg/icon/`, stored in the database and
          // referenced by nothing in the codebase. Requiring a scheme here
          // would make every one of them unsaveable.
          help: "A full URL, or a site path such as /static/svg/icon/python.svg.",
        },
        { name: "description", column: aboutSkill.description, label: "Description", kind: "textarea" },
      ],
    },
  ],
};

export const organizationForm: AdminFormModel = {
  key: "organization",
  from: aboutOrganization,
  pk: aboutOrganization.id,
  label: (values) => String(values.name ?? "Organization"),
  // `on_delete=PROTECT` on all four relations, so Postgres refuses to remove one
  // that is still in use and says so as a foreign-key violation. Offering the
  // button is right: an organisation nothing references is genuinely deletable.
  deleteWarning: "An organization still used by an experience, degree, award or certification cannot be removed.",
  fieldsets: [
    {
      fields: [
        {
          name: "name",
          column: aboutOrganization.name,
          label: "Name",
          kind: "text",
          required: true,
          maxLength: 255,
        },
        {
          name: "slug",
          column: aboutOrganization.slug,
          label: "Slug",
          kind: "slug",
          maxLength: 255,
          slugFrom: "name",
          help: "Left blank, this is derived from the name.",
        },
        {
          name: "website",
          column: aboutOrganization.website,
          label: "Website",
          kind: "url",
          maxLength: 200,
        },
      ],
    },
    {
      title: "Logo",
      help: "Shown beside every experience, degree, award and certification this organization issued.",
      fields: [
        {
          name: "logo",
          column: aboutOrganization.logo,
          label: "Logo",
          kind: "image",
          prefix: "logo",
          help: "One logo often covers several records. Replacing it here replaces it on all of them.",
        },
      ],
    },
  ],
};

/**
 * The organisation picker, shared by the four models that record something an
 * organisation issued.
 *
 * Django used `autocomplete_fields`, which is a searchable widget over an
 * endpoint. A plain select is enough for nineteen rows and needs no endpoint;
 * the moment that list outgrows a screenful is the moment to build the search.
 */
const organizationField = (column: PgColumn): FormField => ({
  name: "organizationId",
  column,
  label: "Organization",
  kind: "reference",
  required: true,
  reference: {
    table: aboutOrganization,
    value: aboutOrganization.id,
    label: aboutOrganization.name,
  },
  help: "Its logo and website come from that record.",
});

export const experienceForm: AdminFormModel = {
  key: "experience",
  from: aboutExperience,
  pk: aboutExperience.id,
  label: (values) => String(values.title ?? "Experience"),
  fieldsets: [
    {
      fields: [
        {
          name: "title",
          column: aboutExperience.title,
          label: "Title",
          kind: "text",
          required: true,
          maxLength: 255,
        },
        organizationField(aboutExperience.organizationId),
        {
          name: "employmentType",
          column: aboutExperience.employmentType,
          label: "Employment",
          kind: "select",
          choices: EMPLOYMENT_TYPE_CHOICES,
          maxLength: 50,
        },
        {
          name: "locationType",
          column: aboutExperience.locationType,
          label: "Arrangement",
          kind: "select",
          choices: LOCATION_TYPE_CHOICES,
          maxLength: 50,
        },
        {
          name: "location",
          column: aboutExperience.location,
          label: "Location",
          kind: "text",
          maxLength: 255,
        },
      ],
    },
    {
      title: "Period",
      fields: [
        {
          name: "periodStart",
          column: aboutExperience.periodStart,
          label: "From",
          kind: "date",
          required: true,
        },
        {
          name: "periodEnd",
          column: aboutExperience.periodEnd,
          label: "To",
          kind: "date",
          help: "Leave blank while the role is current.",
        },
        {
          name: "isCurrent",
          column: aboutExperience.isCurrent,
          label: "Current",
          kind: "checkbox",
        },
        {
          name: "sortOrder",
          column: aboutExperience.sortOrder,
          label: "Order",
          kind: "number",
          min: 0,
          help: "The sequence the about page renders in, which is editorial rather than chronological.",
        },
      ],
    },
    {
      title: "Responsibilities",
      fields: [
        {
          name: "responsibilities",
          column: aboutExperience.responsibilities,
          label: "Responsibilities",
          kind: "string-list",
          multiline: true,
          itemLabel: "responsibility",
        },
      ],
    },
  ],
};

export const educationForm: AdminFormModel = {
  key: "education",
  from: aboutEducation,
  pk: aboutEducation.id,
  label: (values) => String(values.degree ?? "Education"),
  fieldsets: [
    {
      fields: [
        {
          name: "degree",
          column: aboutEducation.degree,
          label: "Degree",
          kind: "text",
          required: true,
          maxLength: 255,
        },
        organizationField(aboutEducation.organizationId),
        {
          name: "alias",
          column: aboutEducation.alias,
          label: "Alias",
          kind: "text",
          maxLength: 100,
        },
        {
          name: "years",
          column: aboutEducation.years,
          label: "Years",
          kind: "text",
          maxLength: 50,
          // Free text, not a range: one stored value reads "2021 - 2025" and the
          // page prints it exactly as typed.
          help: "Shown as typed, for example 2021 - 2025.",
        },
        { name: "dateStart", column: aboutEducation.dateStart, label: "Started", kind: "date" },
        { name: "dateEnd", column: aboutEducation.dateEnd, label: "Ended", kind: "date" },
        { name: "isLast", column: aboutEducation.isLast, label: "Latest", kind: "checkbox" },
      ],
    },
    {
      title: "Location",
      fields: [
        {
          name: "locationRegency",
          column: aboutEducation.locationRegency,
          label: "Regency",
          kind: "text",
          maxLength: 100,
        },
        {
          name: "locationProvince",
          column: aboutEducation.locationProvince,
          label: "Province",
          kind: "text",
          maxLength: 100,
        },
        {
          name: "locationProv",
          column: aboutEducation.locationProv,
          label: "Province, short",
          kind: "text",
          maxLength: 100,
        },
        {
          name: "locationCountry",
          column: aboutEducation.locationCountry,
          label: "Country",
          kind: "text",
          maxLength: 100,
        },
        {
          name: "locationFlag",
          column: aboutEducation.locationFlag,
          label: "Flag",
          kind: "text",
          maxLength: 16,
        },
        {
          name: "locationMapUrl",
          column: aboutEducation.locationMapUrl,
          label: "Map",
          kind: "url",
          maxLength: 200,
        },
      ],
    },
    {
      title: "Achievements",
      fields: [
        {
          name: "achievements",
          column: aboutEducation.achievements,
          label: "Achievements",
          kind: "string-list",
          multiline: true,
          itemLabel: "achievement",
        },
      ],
    },
  ],
};

export const awardForm: AdminFormModel = {
  key: "award",
  from: aboutAward,
  pk: aboutAward.id,
  label: (values) => String(values.title ?? "Award"),
  fieldsets: [
    {
      fields: [
        {
          name: "title",
          column: aboutAward.title,
          label: "Title",
          kind: "text",
          required: true,
          maxLength: 255,
        },
        organizationField(aboutAward.organizationId),
        {
          name: "issued",
          column: aboutAward.issued,
          label: "Issued",
          kind: "date",
          required: true,
          // The model's own help_text. The day is stored but never rendered.
          help: "Only the month and year are shown on the site.",
        },
        {
          name: "credentialUrl",
          column: aboutAward.credentialUrl,
          label: "Credential",
          kind: "url",
          maxLength: 200,
        },
        {
          name: "description",
          column: aboutAward.description,
          label: "Description",
          kind: "textarea",
        },
      ],
    },
  ],
};

export const certificationForm: AdminFormModel = {
  key: "certification",
  from: aboutCertification,
  pk: aboutCertification.id,
  label: (values) => String(values.title ?? "Certification"),
  fieldsets: [
    {
      fields: [
        {
          name: "title",
          column: aboutCertification.title,
          label: "Title",
          kind: "text",
          required: true,
          maxLength: 255,
        },
        organizationField(aboutCertification.organizationId),
        {
          name: "issued",
          column: aboutCertification.issued,
          label: "Issued",
          kind: "date",
          required: true,
          help: "Only the month and year are shown on the site.",
        },
        {
          name: "credentialUrl",
          column: aboutCertification.credentialUrl,
          label: "Credential",
          kind: "url",
          maxLength: 200,
        },
        {
          name: "isFeatured",
          column: aboutCertification.isFeatured,
          label: "Featured",
          kind: "checkbox",
          help: "Featured certifications lead the about page; the rest sit behind the LinkedIn link.",
        },
      ],
    },
    {
      title: "Achievements",
      fields: [
        {
          name: "achievements",
          column: aboutCertification.achievements,
          label: "Achievements",
          kind: "string-list",
          multiline: true,
          itemLabel: "achievement",
        },
      ],
    },
  ],
};

export const applicationForm: AdminFormModel = {
  key: "application",
  from: aboutApplication,
  pk: aboutApplication.id,
  label: (values) => `${values.position ?? "Application"} at ${values.companyName ?? ""}`.trim(),
  fieldsets: [
    {
      fields: [
        {
          name: "companyName",
          column: aboutApplication.companyName,
          label: "Company",
          kind: "text",
          required: true,
          maxLength: 255,
        },
        {
          name: "position",
          column: aboutApplication.position,
          label: "Position",
          kind: "text",
          required: true,
          maxLength: 255,
        },
        {
          name: "status",
          column: aboutApplication.status,
          label: "Status",
          kind: "select",
          required: true,
          choices: APPLICATION_STATUS_CHOICES,
          maxLength: 20,
        },
        {
          name: "appliedVia",
          column: aboutApplication.appliedVia,
          label: "Applied via",
          kind: "select",
          choices: APPLIED_VIA_CHOICES,
          maxLength: 20,
        },
      ],
    },
    {
      title: "Arrangement",
      fields: [
        {
          name: "employmentType",
          column: aboutApplication.employmentType,
          label: "Employment",
          kind: "select",
          choices: EMPLOYMENT_TYPE_CHOICES,
          maxLength: 20,
        },
        {
          name: "locationType",
          column: aboutApplication.locationType,
          label: "Arrangement",
          kind: "select",
          choices: LOCATION_TYPE_CHOICES,
          maxLength: 20,
        },
        {
          name: "location",
          column: aboutApplication.location,
          label: "Location",
          kind: "text",
          maxLength: 255,
        },
        {
          name: "salaryRange",
          column: aboutApplication.salaryRange,
          label: "Salary range",
          kind: "text",
          maxLength: 100,
        },
      ],
    },
    {
      title: "Afterwards",
      fields: [
        {
          name: "lessonsLearned",
          column: aboutApplication.lessonsLearned,
          label: "Lessons learned",
          kind: "textarea",
        },
      ],
    },
  ],
};
