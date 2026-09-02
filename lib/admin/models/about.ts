import { eq } from "drizzle-orm";

import type { PgColumn } from "drizzle-orm/pg-core";

import {
  application,
  applicationSource,
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
  jobOpening,
  location,
  openToWorkListItem,
  organization,
  profile,
  profileLink,
  profileSkillHighlight,
  projectSkill,
  skill,
  workMode,
  applicationStatus as applicationStatusTable,
} from "@/lib/db/app-schema";

import { countWhere, lookup, lookupOr } from "@/lib/admin/sql";
import { usageSentence, usageTotal, type UsageRelation } from "@/lib/admin/usage";

import { composedLabel, type AdminFormModel, type FormField } from "@/lib/admin/form";
import { locationLabel } from "@/lib/data/location";
import type { AdminListModel } from "@/lib/admin/list";

/**
 * The seven `about` changelists.
 *
 * One module rather than seven: four of them display the same foreign key, and
 * the subquery that fetches it belongs beside all four rather than being
 * retyped in four files.
 */

/**
 * The organisation's name, without a join.
 *
 * A correlated subquery, not a join: it is one query either way, but this
 * leaves a single table in `FROM`, so ordering, filtering, counting and paging
 * all compose without join plumbing the count query would have to repeat. There
 * are 19 organisations and the lookup is by primary key.
 */
const organizationName = (fk: PgColumn) =>
  lookup<string>(organization.name, organization.id, fk);

// --- Experience --------------------------------------------------------------


/*
 * Labels read through their foreign key.
 *
 * Employment type, work mode, application status and the employer were free
 * varchar repeated across `about_experience` and `about_application` -- with
 * `''` standing in for "unknown" on 15 application rows, and 53 employers that
 * existed only as a string. They are rows now, so the label a screen shows and
 * the value it offers come from one place.
 */
const applicationEmployment = lookupOr(employmentType.label, employmentType.id, application.employmentTypeId, "");
const applicationMode = lookupOr(workMode.label, workMode.id, application.workModeId, "");
const applicationStatus = lookupOr(applicationStatusTable.label, applicationStatusTable.id, application.statusId, "");
const applicationOrg = lookupOr(organization.name, organization.id, application.organizationId, "");
const skillCategory = lookupOr(category.label, category.id, skill.categoryId, "");


/** The reference fields the career screens share. */
const employmentField = (column: PgColumn) => ({
  name: "employmentTypeId",
  column,
  label: "Employment",
  kind: "reference" as const,
  reference: { table: employmentType, value: employmentType.id, label: employmentType.label },
});

const workModeField = (column: PgColumn) => ({
  name: "workModeId",
  column,
  label: "Arrangement",
  kind: "reference" as const,
  reference: { table: workMode, value: workMode.id, label: workMode.label },
});

/**
 * The place picker, shared by every form that names one.
 *
 * **Labelled by all three name parts, not by the city.** A location's city,
 * region and country are each `NOT NULL DEFAULT ''` -- the schema says so
 * deliberately, because a country with no city is a real place -- so labelling
 * options by the city column alone drew a blank, clickable strip for every
 * country-only row. `locationLabel` is the rule the public pages already
 * render these with, and it is reused rather than restated so the admin and
 * the site cannot disagree about what a place is called.
 *
 * Exported because the openhire form names a place too and used to repeat this
 * declaration, which is how one of them could be fixed and the other not.
 */
export const locationField = (column: PgColumn) => ({
  name: "locationId",
  column,
  label: "Location",
  kind: "reference" as const,
  reference: {
    table: location,
    value: location.id,
    label: composedLabel(
      {
        city: location.city,
        region: location.region,
        country: location.country,
        flag: location.flag,
      },
      locationLabel,
    ),
  },
  help: "Shared with education, applications and the openhire lists.",
});

export type ExperienceRow = {
  id: string;
  title: string;
  organization: string;
  periodStart: string;
  periodEnd: string | null;
  position: number;
  isCurrent: boolean;
};

const experienceOrganization = organizationName(experience.organizationId);

export const experienceList: AdminListModel<ExperienceRow> = {
  key: "experience",
  from: experience,
  pk: experience.id,
  select: {
    id: experience.id,
    title: experience.title,
    organization: experienceOrganization,
    periodStart: experience.periodStart,
    periodEnd: experience.periodEnd,
    position: experience.position,
    isCurrent: experience.isCurrent,
  },
  columns: [
    { key: "title", label: "Title", sort: experience.title, value: (row) => row.title },
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
      sort: experience.periodStart,
      value: (row) => row.periodStart,
    },
    // A null end date is the role still being held, which is what `is_current`
    // says beside it -- so it shows as a dash rather than being hidden.
    {
      key: "period_end",
      label: "To",
      kind: "date",
      sort: experience.periodEnd,
      value: (row) => row.periodEnd,
    },
    {
      key: "sort_order",
      label: "Order",
      kind: "number",
      sort: experience.position,
      value: (row) => row.position,
    },
    {
      key: "is_current",
      label: "Current",
      kind: "bool",
      sort: experience.isCurrent,
      value: (row) => row.isCurrent,
    },
  ],
  filters: [
    { key: "is_current", label: "Current", kind: "boolean", column: experience.isCurrent },
    {
      key: "employment_type",
      label: "Employment",
      kind: "choice",
      column: experience.employmentTypeId,
      choices: { table: employmentType, value: employmentType.id, label: employmentType.label },
    },
    {
      key: "location_type",
      label: "Arrangement",
      kind: "choice",
      column: experience.workModeId,
      choices: { table: workMode, value: workMode.id, label: workMode.label },
    },
    { key: "period_start", label: "Started", kind: "date", column: experience.periodStart },
  ],
  search: {
    fields: [experience.title, experienceOrganization],
    placeholder: "Search title or organization",
  },
  // `ordering = ["sort_order"]` on the model, which is the sequence the about
  // page renders in -- editorial, not chronological.
  defaultSort: { key: "sort_order", dir: "asc" },
  rowId: (row) => row.id,
};

// --- Education ---------------------------------------------------------------

export type EducationRow = {
  id: string;
  degree: string;
  organization: string;
  years: string | null;
  dateStart: string | null;
  isLast: boolean;
};

const educationOrganization = organizationName(education.organizationId);

export const educationList: AdminListModel<EducationRow> = {
  key: "education",
  from: education,
  pk: education.id,
  select: {
    id: education.id,
    degree: education.degree,
    organization: educationOrganization,
    years: education.years,
    dateStart: education.dateStart,
    isLast: education.isLast,
  },
  columns: [
    { key: "degree", label: "Degree", sort: education.degree, value: (row) => row.degree },
    {
      key: "organization",
      label: "Organization",
      kind: "muted",
      sort: educationOrganization,
      value: (row) => row.organization,
    },
    // Free text ("2021 - 2025"), not a date range -- stored as typed.
    { key: "years", label: "Years", kind: "muted", sort: education.years, value: (row) => row.years },
    {
      key: "date_start",
      label: "Started",
      kind: "date",
      sort: education.dateStart,
      value: (row) => row.dateStart,
    },
    {
      key: "is_last",
      label: "Latest",
      kind: "bool",
      sort: education.isLast,
      value: (row) => row.isLast,
    },
    // `ordering = ["id"]` on the model, and `id` is not in `list_display`, so
    // the ordering had nothing to hang off. Naming it in `defaultSort` alone
    // would leave the list unsortable by the very thing it is sorted by, so it
    // gets a column of its own.
    //
    // `code`, not `number`: this key is a uuid. As a number it was right
    // aligned, tabular and -- the part that showed -- `whitespace-nowrap`, so
    // 36 unbreakable characters set the table's minimum width all by
    // themselves and the changelist scrolled sideways inside its own box on a
    // 1024px screen. The kind is a leftover from the serial keys.
    { key: "id", label: "#", kind: "code", sort: education.id, value: (row) => row.id },
  ],
  filters: [{ key: "is_last", label: "Latest", kind: "boolean", column: education.isLast }],
  search: {
    fields: [education.degree, educationOrganization],
    placeholder: "Search degree or organization",
  },
  defaultSort: { key: "id", dir: "asc" },
  rowId: (row) => row.id,
};

// --- Award -------------------------------------------------------------------

export type AwardRow = { id: string; title: string; organization: string; issued: string };

const awardOrganization = organizationName(award.organizationId);

export const awardList: AdminListModel<AwardRow> = {
  key: "award",
  from: award,
  pk: award.id,
  select: {
    id: award.id,
    title: award.title,
    organization: awardOrganization,
    issued: award.issued,
  },
  columns: [
    { key: "title", label: "Title", sort: award.title, value: (row) => row.title },
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
    { key: "issued", label: "Issued", kind: "date", sort: award.issued, value: (row) => row.issued },
  ],
  filters: [{ key: "issued", label: "Issued", kind: "date", column: award.issued }],
  search: { fields: [award.title, awardOrganization], placeholder: "Search title or organization" },
  // `ordering = ["-id"]` -- newest first.
  defaultSort: { key: "issued", dir: "desc" },
  rowId: (row) => row.id,
};

// --- Certification -----------------------------------------------------------

export type CertificationRow = {
  id: string;
  title: string;
  organization: string;
  isFeatured: boolean;
  issued: string;
};

const certificationOrganization = organizationName(certification.organizationId);

export const certificationList: AdminListModel<CertificationRow> = {
  key: "certification",
  from: certification,
  pk: certification.id,
  select: {
    id: certification.id,
    title: certification.title,
    organization: certificationOrganization,
    isFeatured: certification.isFeatured,
    issued: certification.issued,
  },
  columns: [
    { key: "title", label: "Title", sort: certification.title, value: (row) => row.title },
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
      sort: certification.isFeatured,
      value: (row) => row.isFeatured,
    },
    {
      key: "issued",
      label: "Issued",
      kind: "date",
      sort: certification.issued,
      value: (row) => row.issued,
    },
  ],
  filters: [
    { key: "is_featured", label: "Featured", kind: "boolean", column: certification.isFeatured },
    { key: "issued", label: "Issued", kind: "date", column: certification.issued },
  ],
  search: {
    fields: [certification.title, certificationOrganization],
    placeholder: "Search title or organization",
  },
  defaultSort: { key: "issued", dir: "desc" },
  /*
   * The few that lead the about page lead this list too, so they can be found
   * without paging through a hundred and eleven rows to reach them. Dropped the
   * moment the reader sorts by anything else -- see `pinned` on the model.
   */
  pinned: certification.isFeatured,
  rowId: (row) => row.id,
};

// --- Skill -------------------------------------------------------------------

export type SkillRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  projects: number;
  highlights: number;
};

/**
 * Every foreign key into `skill`, and what to call the rows behind it.
 *
 * Both are `ON DELETE CASCADE`, which makes this the screen where the count
 * matters most rather than least. An organization is protected -- Postgres
 * refuses to delete one an experience still names -- but a skill deleted here
 * is removed from every project that listed it and from the profile
 * highlights, silently, with nothing to refuse and nothing to undo it. The
 * only warning available is the number, before the click.
 */
export const SKILL_USAGE: UsageRelation[] = [
  { column: projectSkill.skillId, noun: "project" },
  { column: profileSkillHighlight.skillId, noun: "highlight" },
];

const skillUsed = usageTotal(SKILL_USAGE, skill.id);
const skillUsedBy = (fk: PgColumn) => countWhere(fk, skill.id);

export const skillList: AdminListModel<SkillRow> = {
  key: "skill",
  from: skill,
  pk: skill.id,
  select: {
    id: skill.id,
    name: skill.name,
    slug: skill.slug,
    category: skillCategory,
    projects: skillUsedBy(projectSkill.skillId),
    highlights: skillUsedBy(profileSkillHighlight.skillId),
  },
  columns: [
    { key: "name", label: "Name", sort: skill.name, value: (row) => row.name },
    { key: "slug", label: "Slug", kind: "code", sort: skill.slug, value: (row) => row.slug },
    { key: "category", label: "Category", kind: "muted", sort: skillCategory, value: (row) => row.category },
    {
      key: "used_by",
      label: "Used by",
      kind: "muted",
      // Sorted by the total, which on this screen is the useful direction:
      // 101 skills, and the ones nothing names are the ones to prune.
      sort: skillUsed,
      value: (row) =>
        usageSentence([
          [row.projects, "project"],
          [row.highlights, "highlight"],
        ]),
    },
  ],
  filters: [
    {
      key: "category",
      label: "Category",
      kind: "choice",
      column: skill.categoryId,
      choices: { table: category, value: category.id, label: category.label },
    },
  ],
  search: { fields: [skill.name, skill.slug], placeholder: "Search name or slug" },
  // `ordering = ["id"]`, but a 101-row catalogue is looked up by name.
  defaultSort: { key: "name", dir: "asc" },
  rowId: (row) => row.id,
};

// --- Application -------------------------------------------------------------

export type ApplicationRow = {
  id: string;
  companyName: string;
  position: string;
  status: string;
  employmentType: string;
  locationType: string;
};

export const applicationList: AdminListModel<ApplicationRow> = {
  key: "application",
  from: application,
  pk: application.id,
  select: {
    id: application.id,
    companyName: applicationOrg,
    position: application.title,
    status: applicationStatus,
    employmentType: applicationEmployment,
    locationType: applicationMode,
  },
  columns: [
    {
      key: "company_name",
      label: "Company",
      sort: applicationOrg,
      value: (row) => row.companyName,
    },
    { key: "position", label: "Position", sort: application.title, value: (row) => row.position },
    { key: "status", label: "Status", kind: "muted", sort: applicationStatus, value: (row) => row.status },
    {
      key: "employment_type",
      label: "Employment",
      kind: "muted",
      sort: applicationEmployment,
      value: (row) => row.employmentType,
    },
    {
      key: "location_type",
      label: "Arrangement",
      kind: "muted",
      sort: applicationMode,
      value: (row) => row.locationType,
    },
    // A uuid, so `code` rather than `number` -- see the note on education's.
    { key: "id", label: "#", kind: "code", sort: application.id, value: (row) => row.id },
  ],
  filters: [
    {
      key: "status",
      label: "Status",
      kind: "choice",
      column: application.statusId,
      choices: { table: applicationStatusTable, value: applicationStatusTable.id, label: applicationStatusTable.label },
    },
    {
      key: "employment_type",
      label: "Employment",
      kind: "choice",
      column: application.employmentTypeId,
      choices: { table: employmentType, value: employmentType.id, label: employmentType.label },
    },
    {
      key: "location_type",
      label: "Arrangement",
      kind: "choice",
      column: application.workModeId,
      choices: { table: workMode, value: workMode.id, label: workMode.label },
    },
  ],
  search: {
    fields: [applicationOrg, application.title],
    placeholder: "Search company or position",
  },
  // `ordering = ["-id"]` -- most recently applied first. There is no date column
  // on this model, so the id is the only thing that carries the sequence.
  defaultSort: { key: "id", dir: "desc" },
  rowId: (row) => row.id,
};

// --- Organization ------------------------------------------------------------

export type OrganizationRow = {
  id: string;
  name: string;
  website: string;
  experiences: number;
  education: number;
  certifications: number;
  awards: number;
  applications: number;
};

/**
 * Every foreign key into `organization`, and what to call the rows behind it.
 *
 * All five, and the fifth is why this is a declared list rather than five
 * entries typed into `select`: `application.organization_id` was added after
 * this screen was written and nothing noticed for as long as it took somebody
 * to read the two side by side. The changelist said an organization named by
 * three job applications was `unused` while `blockers.ts` -- which reads
 * `pg_constraint` rather than a transcription -- refused the delete and named
 * them. `scripts/check-admin-usage.mjs` is what stops the next one.
 *
 * Ordered as the cell reads them, longest-standing relation first.
 */
export const ORGANIZATION_USAGE: UsageRelation[] = [
  { column: experience.organizationId, noun: "experience" },
  { column: education.organizationId, noun: "education" },
  { column: certification.organizationId, noun: "certification" },
  { column: award.organizationId, noun: "award" },
  { column: application.organizationId, noun: "application" },
];

const organizationUsed = usageTotal(ORGANIZATION_USAGE, organization.id);
const usedBy = (fk: PgColumn) => countWhere(fk, organization.id);

export const organizationList: AdminListModel<OrganizationRow> = {
  key: "organization",
  from: organization,
  pk: organization.id,
  select: {
    id: organization.id,
    name: organization.name,
    website: organization.website,
    experiences: usedBy(experience.organizationId),
    education: usedBy(education.organizationId),
    certifications: usedBy(certification.organizationId),
    awards: usedBy(award.organizationId),
    applications: usedBy(application.organizationId),
  },
  columns: [
    { key: "name", label: "Name", sort: organization.name, value: (row) => row.name },
    {
      key: "website",
      label: "Website",
      kind: "muted",
      sort: organization.website,
      value: (row) => row.website,
    },
    {
      key: "used_by",
      label: "Used by",
      kind: "muted",
      // The cell is a breakdown and the sort key is the total: five counts
      // summed in SQL, so the header orders by how much an organization is
      // relied on rather than by one relation standing in for the rest.
      sort: organizationUsed,
      value: (row) =>
        usageSentence([
          [row.experiences, "experience"],
          [row.education, "education"],
          [row.certifications, "certification"],
          [row.awards, "award"],
          [row.applications, "application"],
        ]),
    },
  ],
  search: {
    fields: [organization.name, organization.website],
    placeholder: "Search name or website",
  },
  defaultSort: { key: "name", dir: "asc" },
  rowId: (row) => row.id,
};

export const skillForm: AdminFormModel = {
  key: "skill",
  from: skill,
  pk: skill.id,
  label: (values) => String(values.name ?? "Skill"),
  // The opposite of the organization's warning below, and worth saying for
  // that reason: both foreign keys into `skill` are `ON DELETE CASCADE`, so
  // nothing refuses this and nothing reports it afterwards. The row simply
  // stops appearing in the tech stacks that listed it.
  deleteWarning:
    "This skill is removed from every project and profile highlight that lists it. Nothing refuses the delete, and the Used by column is the only warning.",
  fieldsets: [
    {
      fields: [
        { name: "name", column: skill.name, label: "Name", kind: "text", required: true, maxLength: 100 },
        {
          name: "slug",
          column: skill.slug,
          label: "Slug",
          kind: "slug",
          maxLength: 50,
          slugFrom: "name",
          help: "Left blank, this is derived from the name.",
        },
        {
          name: "categoryId",
          column: skill.categoryId,
          label: "Category",
          kind: "reference",
          reference: {
            table: category,
            value: category.id,
            label: category.label,
            where: eq(category.kind, "skill"),
          },
          help: "Groups the skill on the about page. Shared with projects and posts.",
        },
      ],
    },
    {
      title: "Presentation",
      fields: [
        {
          name: "iconId",
          column: skill.iconId,
          label: "Icon",
          kind: "image",
          prefix: "icon",
          /*
           * Was a `text` column holding an absolute URL into the production
           * site on 78 rows, which pointed development and this admin at that
           * site and would have broken all 78 the moment the domain moved.
           *
           * It is a media asset now, and all 74 icons are objects in the bucket
           * like every other upload -- so replacing one through this control is
           * an ordinary upload rather than a special case. `assetUrl` still
           * reads `source`, because the column permits a file served from
           * `public/` and nothing guarantees the next asset is not one.
           */
        },
        { name: "description", column: skill.description, label: "Description", kind: "textarea" },
      ],
    },
  ],
};

export const organizationForm: AdminFormModel = {
  key: "organization",
  from: organization,
  pk: organization.id,
  label: (values) => String(values.name ?? "Organization"),
  // `ON DELETE RESTRICT` on all five relations, so Postgres refuses to remove
  // one that is still in use and `lib/admin/blockers.ts` turns that refusal
  // into the rows behind it. Offering the button is right: an organization
  // nothing references is genuinely deletable, and the Used by column says
  // which those are.
  deleteWarning:
    "An organization still used by an experience, degree, award, certification or application cannot be removed.",
  fieldsets: [
    {
      fields: [
        {
          name: "name",
          column: organization.name,
          label: "Name",
          kind: "text",
          required: true,
          maxLength: 255,
        },
        {
          name: "slug",
          column: organization.slug,
          label: "Slug",
          kind: "slug",
          maxLength: 255,
          slugFrom: "name",
          help: "Left blank, this is derived from the name.",
        },
        {
          name: "website",
          column: organization.website,
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
          column: organization.logoId,
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
 * A plain select. It is enough for nineteen rows and needs no endpoint behind
 * it; the moment that list outgrows a screenful is the moment to build a
 * searchable one.
 */
const organizationField = (column: PgColumn): FormField => ({
  name: "organizationId",
  column,
  label: "Organization",
  kind: "reference",
  required: true,
  reference: {
    table: organization,
    value: organization.id,
    label: organization.name,
  },
  help: "Its logo and website come from that record.",
});

export const experienceForm: AdminFormModel = {
  key: "experience",
  from: experience,
  pk: experience.id,
  label: (values) => String(values.title ?? "Experience"),
  deleteWarning: "The responsibilities listed under this role are deleted with it.",
  fieldsets: [
    {
      fields: [
        {
          name: "title",
          column: experience.title,
          label: "Title",
          kind: "text",
          required: true,
          maxLength: 255,
        },
        organizationField(experience.organizationId),
        employmentField(experience.employmentTypeId),
        workModeField(experience.workModeId),
        locationField(experience.locationId),
      ],
    },
    {
      title: "Period",
      fields: [
        {
          name: "periodStart",
          column: experience.periodStart,
          label: "From",
          kind: "date",
          required: true,
        },
        {
          name: "periodEnd",
          column: experience.periodEnd,
          label: "To",
          kind: "date",
          help: "Leave blank while the role is current.",
        },
        {
          name: "isCurrent",
          column: experience.isCurrent,
          label: "Current",
          kind: "checkbox",
        },
        {
          name: "sortOrder",
          column: experience.position,
          label: "Order",
          kind: "number",
          min: 0,
          help: "The sequence the about page renders in, which is editorial rather than chronological.",
        },
      ],
    },
  ],
  inlines: [
    {
      name: "tasks",
      table: experienceTask,
      pk: experienceTask.id,
      parent: experienceTask.experienceId,
      title: "Responsibilities",
      help: "Shown in this order under the role.",
      itemLabel: "responsibility",
      orderColumn: experienceTask.position,
      fields: [
        { name: "body", column: experienceTask.body, label: "Text", kind: "textarea" },
      ],
    },
  ],
};

export const educationForm: AdminFormModel = {
  key: "education",
  from: education,
  pk: education.id,
  label: (values) => String(values.degree ?? "Education"),
  deleteWarning: "The achievements listed under this degree are deleted with it.",
  fieldsets: [
    {
      fields: [
        {
          name: "degree",
          column: education.degree,
          label: "Degree",
          kind: "text",
          required: true,
          maxLength: 255,
        },
        organizationField(education.organizationId),
        {
          name: "alias",
          column: education.alias,
          label: "Alias",
          kind: "text",
          maxLength: 100,
        },
        {
          name: "years",
          column: education.years,
          label: "Years",
          kind: "text",
          maxLength: 50,
          // Free text, not a range: one stored value reads "2021 - 2025" and the
          // page prints it exactly as typed.
          help: "Shown as typed, for example 2021 - 2025.",
        },
        { name: "dateStart", column: education.dateStart, label: "Started", kind: "date" },
        { name: "dateEnd", column: education.dateEnd, label: "Ended", kind: "date" },
        { name: "isLast", column: education.isLast, label: "Latest", kind: "checkbox" },
      ],
    },
    {
      title: "Location",
      fields: [locationField(education.locationId)],
    },
  ],
  inlines: [
    {
      name: "achievements",
      table: educationAchievement,
      pk: educationAchievement.id,
      parent: educationAchievement.educationId,
      title: "Achievements",
      itemLabel: "achievement",
      orderColumn: educationAchievement.position,
      fields: [
        { name: "body", column: educationAchievement.body, label: "Text", kind: "textarea" },
      ],
    },
  ],
};

export const awardForm: AdminFormModel = {
  key: "award",
  from: award,
  pk: award.id,
  label: (values) => String(values.title ?? "Award"),
  fieldsets: [
    {
      fields: [
        {
          name: "title",
          column: award.title,
          label: "Title",
          kind: "text",
          required: true,
          maxLength: 255,
        },
        organizationField(award.organizationId),
        {
          name: "issued",
          column: award.issued,
          label: "Issued",
          kind: "date",
          required: true,
          // The model's own help_text. The day is stored but never rendered.
          help: "Only the month and year are shown on the site.",
        },
        {
          name: "credentialUrl",
          column: award.credentialUrl,
          label: "Credential",
          kind: "url",
          maxLength: 200,
        },
        {
          name: "description",
          column: award.description,
          label: "Description",
          kind: "textarea",
        },
      ],
    },
  ],
};

export const certificationForm: AdminFormModel = {
  key: "certification",
  from: certification,
  pk: certification.id,
  label: (values) => String(values.title ?? "Certification"),
  deleteWarning: "The achievements listed under this certification are deleted with it.",
  fieldsets: [
    {
      fields: [
        {
          name: "title",
          column: certification.title,
          label: "Title",
          kind: "text",
          required: true,
          maxLength: 255,
        },
        organizationField(certification.organizationId),
        {
          name: "issued",
          column: certification.issued,
          label: "Issued",
          kind: "date",
          required: true,
          help: "Only the month and year are shown on the site.",
        },
        {
          name: "credentialUrl",
          column: certification.credentialUrl,
          label: "Credential",
          kind: "url",
          maxLength: 200,
        },
        {
          name: "isFeatured",
          column: certification.isFeatured,
          label: "Featured",
          kind: "checkbox",
          help: "Featured certifications lead the about page; the rest sit behind the LinkedIn link.",
        },
      ],
    },
  ],
  inlines: [
    {
      name: "achievements",
      table: certificationAchievement,
      pk: certificationAchievement.id,
      parent: certificationAchievement.certificationId,
      title: "Achievements",
      itemLabel: "achievement",
      orderColumn: certificationAchievement.position,
      fields: [
        { name: "body", column: certificationAchievement.body, label: "Text", kind: "textarea" },
      ],
    },
  ],
};

export const applicationForm: AdminFormModel = {
  key: "application",
  from: application,
  pk: application.id,
  label: (values) => String(values.position ?? "Application"),
  deleteWarning: "Every step recorded against this application is deleted with it.",
  fieldsets: [
    {
      fields: [
        {
          // The employer is an organization like any other, so a company that
          // also issued a certification or employed you is one row rather than
          // a string repeated in three tables.
          name: "organizationId",
          column: application.organizationId,
          label: "Company",
          kind: "reference",
          required: true,
          reference: { table: organization, value: organization.id, label: organization.name },
        },
        {
          name: "position",
          column: application.title,
          label: "Position",
          kind: "text",
          required: true,
          maxLength: 255,
        },
        {
          name: "statusId",
          column: application.statusId,
          label: "Status",
          kind: "reference",
          required: true,
          reference: {
            table: applicationStatusTable,
            value: applicationStatusTable.id,
            label: applicationStatusTable.label,
          },
        },
        {
          name: "sourceId",
          column: application.sourceId,
          label: "Applied via",
          kind: "reference",
          reference: {
            table: applicationSource,
            value: applicationSource.id,
            label: applicationSource.label,
          },
        },
      ],
    },
    {
      title: "Arrangement",
      fields: [
        employmentField(application.employmentTypeId),
        workModeField(application.workModeId),
        locationField(application.locationId),
        {
          name: "salaryRange",
          column: application.salaryRange,
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
          column: application.lessonsLearned,
          label: "Lessons learned",
          kind: "textarea",
        },
      ],
    },
  ],
  inlines: [
    {
      /*
       * Ordered by when each step happened rather than by a column, which is
       * the model's own `ordering = ["timestamp"]`. There is no order column to
       * write, so the reorder buttons are absent -- moving a step means changing
       * its timestamp, which is what actually decides where it appears.
       */
      name: "journey",
      table: applicationStep,
      pk: applicationStep.id,
      parent: applicationStep.applicationId,
      orderBy: applicationStep.occurredAt,
      title: "Journey",
      itemLabel: "step",
      fields: [
        {
          name: "title",
          column: applicationStep.title,
          label: "Step",
          kind: "text",
          required: true,
          maxLength: 255,
        },
        { name: "timestamp", column: applicationStep.occurredAt, label: "When", kind: "datetime" },
        { name: "details", column: applicationStep.details, label: "Details", kind: "textarea" },
        { name: "notes", column: applicationStep.notes, label: "Notes", kind: "textarea" },
      ],
    },
  ],
};

export const profileForm: AdminFormModel = {
  key: "profile",
  from: profile,
  pk: profile.id,
  label: (values) => String(values.name ?? "Profile"),
  /*
   * Refused to everybody, superuser included -- the one place in this admin
   * where that role is not the answer.
   *
   * There is exactly one of these rows and nothing here can make another: the
   * form *is* the record, so there is no create to fall back on. The public
   * layout renders it on every page, so deleting it does not remove a record,
   * it takes the site down, and leaves no way back through this interface.
   *
   * A different kind of refusal from the two `"superuser"` ones on `user` and
   * `project-status`, which are about consequence. This one is about there
   * being nothing on the other side of the act.
   */
  canCreate: false,
  canDelete: false,
  fieldsets: [
    {
      fields: [
        { name: "name", column: profile.name, label: "Name", kind: "text", required: true, maxLength: 255 },
        { name: "firstName", column: profile.firstName, label: "First name", kind: "text", maxLength: 100 },
        { name: "lastName", column: profile.lastName, label: "Last name", kind: "text", maxLength: 100 },
        { name: "username", column: profile.username, label: "Username", kind: "text", maxLength: 100 },
        { name: "aka", column: profile.aka, label: "Also known as", kind: "text", maxLength: 100 },
        { name: "role", column: profile.role, label: "Role", kind: "text", maxLength: 255 },
        {
          name: "image",
          column: profile.imageId,
          label: "Photo",
          kind: "image",
          prefix: "profile",
          // The same file is named by all twenty blog posts as their author
          // photo. Replacing it here leaves theirs pointing at the old key,
          // which is still in the bucket because it is still referenced.
          help: "Shared with every blog post's author photo. Replacing it here changes only the profile.",
        },
      ],
    },
    {
      title: "Status",
      help: "All three can be true at once, and the sidebar stacks the badges when they are.",
      fields: [
        { name: "isOpenToWork", column: profile.isOpenToWork, label: "Open to work", kind: "checkbox" },
        { name: "isHiring", column: profile.isHiring, label: "Hiring", kind: "checkbox" },
        { name: "isSick", column: profile.isSick, label: "Under the weather", kind: "checkbox" },
      ],
    },
    {
      title: "Bio",
      fields: [
        {
          name: "shortDescription",
          column: profile.shortDescription,
          label: "Short description",
          kind: "textarea",
        },
        { name: "shortBio", column: profile.shortBio, label: "Short bio", kind: "textarea" },
        { name: "shortCta", column: profile.shortCta, label: "Call to action", kind: "textarea" },
        {
          name: "longDescription",
          column: profile.longDescription,
          label: "Long description",
          kind: "textarea",
        },
        {
          name: "storiesHtml",
          column: profile.storiesHtml,
          label: "Stories",
          kind: "rich-text",
          help: "The letter on the about page, between the two greetings. Same editor and the same allowed vocabulary as a blog body.",
        },
      ],
    },
    {
      title: "Links",
      fields: [
        {
          name: "personalWebsite",
          column: profile.personalWebsite,
          label: "Personal website",
          kind: "url",
          maxLength: 200,
        },
      ],
    },
    {
      title: "Location",
      fields: [
        locationField(profile.locationId),
        {
          name: "residency",
          column: profile.residency,
          label: "Residency",
          kind: "text",
          maxLength: 100,
          help: "What the home page prints; the location record carries the full regency and province.",
        },
      ],
    },
  ],
  inlines: [
    {
      /*
       * Ordered on purpose, and the order is not cosmetic: this list becomes the
       * JSON-LD `knowsAbout` array. It is a through table rather than a plain
       * many-to-many precisely because a plain one cannot express a sequence.
       */
      name: "highlights",
      table: profileSkillHighlight,
      pk: profileSkillHighlight.id,
      parent: profileSkillHighlight.profileId,
      title: "Highlighted skills",
      help: "The order here is the order of the JSON-LD knowsAbout array.",
      itemLabel: "skill",
      orderColumn: profileSkillHighlight.position,
      fields: [
        {
          name: "skillId",
          column: profileSkillHighlight.skillId,
          label: "Skill",
          kind: "reference",
          required: true,
          reference: { table: skill, value: skill.id, label: skill.name },
        },
      ],
    },
    {
      name: "socialLinks",
      table: profileLink,
      pk: profileLink.id,
      parent: profileLink.profileId,
      scope: { column: profileLink.kind, value: "social" },
      title: "Social",
      help: "Eight social_* columns before, so adding a platform meant a migration.",
      itemLabel: "link",
      orderColumn: profileLink.position,
      fields: [
        { name: "platform", column: profileLink.platform, label: "Label", kind: "text", required: true },
        { name: "url", column: profileLink.url, label: "URL", kind: "text", required: true },
      ],
    },
    {
      name: "cvLinks",
      table: profileLink,
      pk: profileLink.id,
      parent: profileLink.profileId,
      scope: { column: profileLink.kind, value: "cv" },
      title: "CV",
      itemLabel: "format",
      orderColumn: profileLink.position,
      fields: [
        { name: "platform", column: profileLink.platform, label: "Label", kind: "text", required: true },
        { name: "url", column: profileLink.url, label: "URL", kind: "text", required: true },
      ],
    },
    {
      name: "donateLinks",
      table: profileLink,
      pk: profileLink.id,
      parent: profileLink.profileId,
      scope: { column: profileLink.kind, value: "donate" },
      title: "Donate",
      itemLabel: "link",
      orderColumn: profileLink.position,
      fields: [
        { name: "platform", column: profileLink.platform, label: "Label", kind: "text", required: true },
        { name: "url", column: profileLink.url, label: "URL", kind: "text", required: true },
      ],
    },
  ],
};

export type LocationRow = {
  id: string;
  city: string;
  region: string;
  country: string;
  flag: string;
  applications: number;
  education: number;
  experiences: number;
  openings: number;
  listItems: number;
  profiles: number;
};

/**
 * Every foreign key into `location`, and what to call the rows behind it.
 *
 * All six are `ON DELETE SET NULL`, so nothing here ever refuses a delete --
 * which is exactly why the count matters. `blockers.ts` filters on the actions
 * that *refuse* and so has nothing to say about a place; without this column
 * the only way to learn that a location is named by four records is to remove
 * it and find four rows quietly emptied.
 *
 * Ordered as the cell reads them.
 */
export const LOCATION_USAGE: UsageRelation[] = [
  { column: experience.locationId, noun: "experience" },
  { column: education.locationId, noun: "degree" },
  { column: application.locationId, noun: "application" },
  { column: jobOpening.locationId, noun: "opening" },
  { column: openToWorkListItem.locationId, noun: "list entry" },
  { column: profile.locationId, noun: "profile" },
];

const locationUsed = usageTotal(LOCATION_USAGE, location.id);
const placesUsedBy = (fk: PgColumn) => countWhere(fk, location.id);

/**
 * Places, as records rather than as a vocabulary picked from.
 *
 * There was no screen for these at all: six tables name a location and every
 * one of them could only ever point at a row that already existed, so a place
 * entered slightly wrong stayed wrong and a new one needed a hand-written
 * insert. The changelist that lists them is the one that lets the city missing
 * from a country-only row be filled in.
 */
export const locationList: AdminListModel<LocationRow> = {
  key: "location",
  from: location,
  pk: location.id,
  select: {
    id: location.id,
    city: location.city,
    region: location.region,
    country: location.country,
    flag: location.flag,
    applications: placesUsedBy(application.locationId),
    education: placesUsedBy(education.locationId),
    experiences: placesUsedBy(experience.locationId),
    openings: placesUsedBy(jobOpening.locationId),
    listItems: placesUsedBy(openToWorkListItem.locationId),
    profiles: placesUsedBy(profile.locationId),
  },
  columns: [
    {
      key: "place",
      label: "Place",
      sort: location.country,
      // The same three parts the dropdowns join, joined the same way, so a row
      // reads here as it reads everywhere it is offered.
      value: (row) => locationLabel(row) || "—",
    },
    { key: "city", label: "City", kind: "muted", sort: location.city, value: (row) => row.city || "—" },
    {
      key: "region",
      label: "Region",
      kind: "muted",
      sort: location.region,
      value: (row) => row.region || "—",
    },
    {
      key: "used_by",
      label: "Used by",
      kind: "muted",
      // The breakdown in the cell, the total as the sort key -- so the places
      // nothing names any more can be brought together and cleared out.
      sort: locationUsed,
      value: (row) =>
        usageSentence([
          [row.experiences, "experience"],
          [row.education, "degree"],
          [row.applications, "application"],
          [row.openings, "opening"],
          [row.listItems, "list entry"],
          [row.profiles, "profile"],
        ]),
    },
  ],
  search: {
    fields: [location.city, location.region, location.country],
    placeholder: "Search city, region or country",
  },
  defaultSort: { key: "place", dir: "asc" },
  rowId: (row) => row.id,
};

export const locationForm: AdminFormModel = {
  key: "location",
  from: location,
  pk: location.id,
  label: (values) =>
    locationLabel({
      city: String(values.city ?? ""),
      region: String(values.region ?? ""),
      country: String(values.country ?? ""),
      flag: String(values.flag ?? ""),
    }) || "Location",
  // Every one of the six references is `on delete set null`, so removing a
  // place empties the field on the records that named it rather than being
  // refused. That is a different warning from the organization's, which is
  // restricted and cannot be deleted while anything points at it.
  deleteWarning:
    "Any experience, degree, application, opening, list entry or profile using this place is left with no location.",
  fieldsets: [
    {
      help: "City, region and country together identify a place -- two rows cannot share all three. Leave the parts that do not apply empty: a country on its own is a real place.",
      fields: [
        { name: "city", column: location.city, label: "City", kind: "text", maxLength: 120 },
        { name: "region", column: location.region, label: "Region", kind: "text", maxLength: 120 },
        {
          name: "country",
          column: location.country,
          label: "Country",
          kind: "text",
          maxLength: 120,
        },
        {
          name: "flag",
          column: location.flag,
          label: "Flag",
          kind: "text",
          maxLength: 16,
          help: "The emoji shown after the country, where there is one.",
        },
      ],
    },
    {
      title: "Map",
      fields: [
        {
          name: "mapUrl",
          column: location.mapUrl,
          label: "Map URL",
          kind: "url",
          maxLength: 500,
        },
      ],
    },
  ],
};
