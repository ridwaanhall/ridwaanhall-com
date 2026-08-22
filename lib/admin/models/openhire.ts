import { lookupOr } from "@/lib/admin/sql";
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

import type { AdminFormModel } from "@/lib/admin/form";
import type { AdminListModel } from "@/lib/admin/list";

/**
 * The two `openhire` singletons, from `apps/openhire/admin.py`.
 *
 * Neither has a changelist: `SingletonModel` forces `pk=1` and blocks delete,
 * and Django's `SingletonModelAdmin` sent the changelist straight to that row.
 * `/admin/hiring-profile` is that record's form.
 */

export const hiringProfileForm: AdminFormModel = {
  key: "hiring-profile",
  from: hiringProfile,
  pk: hiringProfile.id,
  label: () => "Hiring profile",
  canCreate: false,
  canDelete: false,
  fieldsets: [
    {
      fields: [
        {
          name: "companyName",
          column: hiringProfile.companyName,
          label: "Company",
          kind: "text",
          maxLength: 255,
        },
        {
          name: "hiringStatus",
          column: hiringProfile.hiringStatus,
          label: "Status",
          kind: "text",
          maxLength: 100,
        },
        { name: "website", column: hiringProfile.website, label: "Website", kind: "url", maxLength: 200 },
        {
          name: "companyDescription",
          column: hiringProfile.companyDescription,
          label: "About the company",
          kind: "textarea",
        },
      ],
    },
    {
      title: "Contact",
      fields: [
        {
          name: "contactEmail",
          column: hiringProfile.contactEmail,
          label: "Email",
          kind: "email",
          maxLength: 254,
        },
        {
          name: "contactApplicationEmail",
          column: hiringProfile.contactApplicationEmail,
          label: "Applications to",
          kind: "email",
          maxLength: 254,
        },
        {
          name: "contactResponseTime",
          column: hiringProfile.contactResponseTime,
          label: "Response time",
          kind: "text",
          maxLength: 255,
        },
      ],
    },

  ],
  inlines: [
    {
      name: "process",
      table: hiringListItem,
      pk: hiringListItem.id,
      parent: hiringListItem.hiringProfileId,
      scope: { column: hiringListItem.kind, value: "process" },
      title: "Application process",
      help: "Rendered as numbered steps, so the order is what a reader follows.",
      itemLabel: "step",
      orderColumn: hiringListItem.position,
      fields: [
        { name: "body", column: hiringListItem.body, label: "Text", kind: "textarea" },
      ],
    },
    {
      name: "culture",
      table: hiringListItem,
      pk: hiringListItem.id,
      parent: hiringListItem.hiringProfileId,
      scope: { column: hiringListItem.kind, value: "culture" },
      title: "Culture",
      itemLabel: "value",
      orderColumn: hiringListItem.position,
      fields: [
        { name: "body", column: hiringListItem.body, label: "Text", kind: "textarea" },
      ],
    },
    {
      name: "requirementsGeneral",
      table: hiringListItem,
      pk: hiringListItem.id,
      parent: hiringListItem.hiringProfileId,
      scope: { column: hiringListItem.kind, value: "requirement_general" },
      title: "General requirements",
      itemLabel: "requirement",
      orderColumn: hiringListItem.position,
      fields: [
        { name: "body", column: hiringListItem.body, label: "Text", kind: "textarea" },
      ],
    },
    {
      name: "requirementsTechnical",
      table: hiringListItem,
      pk: hiringListItem.id,
      parent: hiringListItem.hiringProfileId,
      scope: { column: hiringListItem.kind, value: "requirement_technical" },
      title: "Technical requirements",
      itemLabel: "requirement",
      orderColumn: hiringListItem.position,
      fields: [
        { name: "body", column: hiringListItem.body, label: "Text", kind: "textarea" },
      ],
    },

  ],
};

export const openToWorkProfileForm: AdminFormModel = {
  key: "open-to-work-profile",
  from: openToWorkProfile,
  pk: openToWorkProfile.id,
  label: () => "Open to work profile",
  canCreate: false,
  canDelete: false,
  fieldsets: [
    {
      fields: [
        { name: "status", column: openToWorkProfile.status, label: "Status", kind: "text", maxLength: 100 },
        {
          name: "availability",
          column: openToWorkProfile.availability,
          label: "Availability",
          kind: "text",
          maxLength: 100,
        },
        {
          name: "experienceLevel",
          column: openToWorkProfile.experienceLevel,
          label: "Experience level",
          kind: "text",
          maxLength: 100,
        },
        {
          name: "noticePeriod",
          column: openToWorkProfile.noticePeriod,
          label: "Notice period",
          kind: "text",
          maxLength: 100,
        },
        {
          name: "salaryExpectation",
          column: openToWorkProfile.salaryExpectation,
          label: "Salary expectation",
          kind: "text",
          maxLength: 100,
        },
        {
          name: "workAuthorization",
          column: openToWorkProfile.workAuthorization,
          label: "Work authorization",
          kind: "text",
          maxLength: 100,
        },
      ],
    },
    {
      title: "What you are open to",
      fields: [
        { name: "remote", column: openToWorkProfile.remote, label: "Open to remote", kind: "checkbox" },
        {
          name: "relocation",
          column: openToWorkProfile.relocation,
          label: "Open to relocation",
          kind: "checkbox",
        },
      ],
    },
    {
      title: "About you",
      fields: [
        {
          name: "showAllToolsSkills",
          column: openToWorkProfile.showAllToolsSkills,
          label: "Show every tool and skill",
          kind: "checkbox",
        },
      ],
    },
    {
      title: "Getting in touch",
      fields: [
        {
          name: "contactPreference",
          column: openToWorkProfile.contactPreference,
          label: "Preferred contact",
          kind: "text",
          maxLength: 100,
        },
        {
          name: "interviewAvailability",
          column: openToWorkProfile.interviewAvailability,
          label: "Interview availability",
          kind: "text",
          maxLength: 255,
        },
        {
          name: "additionalNotes",
          column: openToWorkProfile.additionalNotes,
          label: "Notes",
          kind: "textarea",
        },
      ],
    },
  ],
  inlines: [
    {
      name: "employmentTypes",
      table: openToWorkListItem,
      pk: openToWorkListItem.id,
      parent: openToWorkListItem.openToWorkProfileId,
      scope: { column: openToWorkListItem.kind, value: "employment_type" },
      title: "Employment types",
      itemLabel: "type",
      orderColumn: openToWorkListItem.position,
      fields: [
        { name: "body", column: openToWorkListItem.body, label: "Text", kind: "text" },
      ],
    },
    {
      name: "workModes",
      table: openToWorkListItem,
      pk: openToWorkListItem.id,
      parent: openToWorkListItem.openToWorkProfileId,
      scope: { column: openToWorkListItem.kind, value: "work_mode" },
      title: "Work arrangements",
      itemLabel: "arrangement",
      orderColumn: openToWorkListItem.position,
      fields: [
        { name: "body", column: openToWorkListItem.body, label: "Text", kind: "text" },
      ],
    },
    {
      name: "preferredRoles",
      table: openToWorkListItem,
      pk: openToWorkListItem.id,
      parent: openToWorkListItem.openToWorkProfileId,
      scope: { column: openToWorkListItem.kind, value: "preferred_role" },
      title: "Preferred roles",
      itemLabel: "role",
      orderColumn: openToWorkListItem.position,
      fields: [
        { name: "body", column: openToWorkListItem.body, label: "Text", kind: "text" },
      ],
    },
    {
      name: "preferredLocations",
      table: openToWorkListItem,
      pk: openToWorkListItem.id,
      parent: openToWorkListItem.openToWorkProfileId,
      scope: { column: openToWorkListItem.kind, value: "preferred_location" },
      title: "Preferred locations",
      itemLabel: "location",
      orderColumn: openToWorkListItem.position,
      fields: [
        { name: "body", column: openToWorkListItem.body, label: "Text", kind: "text" },
      ],
    },
    {
      name: "remoteLocations",
      table: openToWorkListItem,
      pk: openToWorkListItem.id,
      parent: openToWorkListItem.openToWorkProfileId,
      scope: { column: openToWorkListItem.kind, value: "remote_location" },
      title: "Remote from",
      itemLabel: "location",
      orderColumn: openToWorkListItem.position,
      fields: [
        { name: "body", column: openToWorkListItem.body, label: "Text", kind: "text" },
      ],
    },
    {
      name: "skillsHighlight",
      table: openToWorkListItem,
      pk: openToWorkListItem.id,
      parent: openToWorkListItem.openToWorkProfileId,
      scope: { column: openToWorkListItem.kind, value: "skill_highlight" },
      title: "Skills",
      help: "Free text rather than the skill catalogue: one stored value has no matching skill row.",
      itemLabel: "skill",
      orderColumn: openToWorkListItem.position,
      fields: [
        { name: "body", column: openToWorkListItem.body, label: "Text", kind: "text" },
      ],
    },
    {
      name: "languages",
      table: openToWorkListItem,
      pk: openToWorkListItem.id,
      parent: openToWorkListItem.openToWorkProfileId,
      scope: { column: openToWorkListItem.kind, value: "language" },
      title: "Languages",
      itemLabel: "language",
      orderColumn: openToWorkListItem.position,
      fields: [
        { name: "body", column: openToWorkListItem.body, label: "Text", kind: "text" },
      ],
    },
    {
      name: "highlights",
      table: portfolioHighlight,
      pk: portfolioHighlight.id,
      parent: portfolioHighlight.openToWorkProfileId,
      title: "Portfolio highlights",
      itemLabel: "highlight",
      orderColumn: portfolioHighlight.position,
      fields: [
        {
          name: "title",
          column: portfolioHighlight.title,
          label: "Title",
          kind: "text",
          required: true,
          maxLength: 255,
        },
        {
          name: "description",
          column: portfolioHighlight.description,
          label: "Description",
          kind: "textarea",
        },
      ],
    },
  ],
};


/**
 * Open positions, as their own screen.
 *
 * They were an inline on the hiring profile, which stopped working when their
 * three lists -- required skills, responsibilities, benefits -- became rows in
 * a child table: those are inlines of the position, and an inline cannot nest
 * inside another. A posting is a substantial record with three ordered lists of
 * its own, so a screen is the honest shape for it rather than a row in someone
 * else's form.
 */
export type JobOpeningRow = {
  id: string;
  title: string;
  employment: string;
  salaryRange: string;
  experienceRequired: string;
};

const openingEmployment = lookupOr(
  employmentType.label,
  employmentType.id,
  jobOpening.employmentTypeId,
  "",
);

export const jobOpeningList: AdminListModel<JobOpeningRow> = {
  key: "job-opening",
  from: jobOpening,
  pk: jobOpening.id,
  select: {
    id: jobOpening.id,
    title: jobOpening.title,
    employment: openingEmployment,
    salaryRange: jobOpening.salaryRange,
    experienceRequired: jobOpening.experienceRequired,
  },
  columns: [
    { key: "title", label: "Title", sort: jobOpening.title, value: (row) => row.title },
    {
      key: "employment",
      label: "Employment",
      kind: "muted",
      sort: openingEmployment,
      value: (row) => row.employment,
    },
    {
      key: "salary",
      label: "Salary",
      kind: "muted",
      sort: jobOpening.salaryRange,
      value: (row) => row.salaryRange,
    },
    {
      key: "experience",
      label: "Experience",
      kind: "muted",
      sort: jobOpening.experienceRequired,
      value: (row) => row.experienceRequired,
    },
  ],
  search: {
    fields: [jobOpening.title, jobOpening.experienceRequired],
    placeholder: "Search title or experience",
  },
  defaultSort: { key: "title", dir: "asc" },
  rowId: (row) => row.id,
};

export const jobOpeningForm: AdminFormModel = {
  key: "job-opening",
  from: jobOpening,
  pk: jobOpening.id,
  label: (values) => String(values.title ?? "Position"),
  deleteWarning: "The skills, responsibilities and benefits go with it.",
  fieldsets: [
    {
      fields: [
        {
          name: "title",
          column: jobOpening.title,
          label: "Title",
          kind: "text",
          required: true,
          maxLength: 255,
        },
        {
          name: "employmentTypeId",
          column: jobOpening.employmentTypeId,
          label: "Employment",
          kind: "reference",
          reference: { table: employmentType, value: employmentType.id, label: employmentType.label },
        },
        {
          name: "locationId",
          column: jobOpening.locationId,
          label: "Location",
          kind: "reference",
          reference: { table: location, value: location.id, label: location.city },
        },
        {
          name: "salaryRange",
          column: jobOpening.salaryRange,
          label: "Salary range",
          kind: "text",
          maxLength: 100,
        },
        {
          name: "experienceRequired",
          column: jobOpening.experienceRequired,
          label: "Experience",
          kind: "text",
          maxLength: 255,
        },
      ],
    },
  ],
  inlines: [
    {
      name: "skills",
      table: jobOpeningListItem,
      pk: jobOpeningListItem.id,
      parent: jobOpeningListItem.jobOpeningId,
      scope: { column: jobOpeningListItem.kind, value: "skill" },
      title: "Required skills",
      itemLabel: "skill",
      orderColumn: jobOpeningListItem.position,
      fields: [
        { name: "body", column: jobOpeningListItem.body, label: "Skill", kind: "text" },
      ],
    },
    {
      name: "responsibilities",
      table: jobOpeningListItem,
      pk: jobOpeningListItem.id,
      parent: jobOpeningListItem.jobOpeningId,
      scope: { column: jobOpeningListItem.kind, value: "responsibility" },
      title: "Responsibilities",
      itemLabel: "responsibility",
      orderColumn: jobOpeningListItem.position,
      fields: [
        { name: "body", column: jobOpeningListItem.body, label: "Text", kind: "textarea" },
      ],
    },
    {
      name: "benefits",
      table: jobOpeningListItem,
      pk: jobOpeningListItem.id,
      parent: jobOpeningListItem.jobOpeningId,
      scope: { column: jobOpeningListItem.kind, value: "benefit" },
      title: "What we offer",
      itemLabel: "benefit",
      orderColumn: jobOpeningListItem.position,
      fields: [
        { name: "body", column: jobOpeningListItem.body, label: "Text", kind: "textarea" },
      ],
    },
  ],
};
