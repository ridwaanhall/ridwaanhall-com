import { EMPLOYMENT_TYPE_CHOICES, LOCATION_TYPE_CHOICES } from "@/lib/admin/choices";
import {
  openhireHiringprofile,
  openhireOpentoworkprofile,
  openhirePortfoliohighlight,
  openhirePosition,
} from "@/lib/db/schema";

import type { AdminFormModel } from "@/lib/admin/form";

/**
 * The two `openhire` singletons, from `apps/openhire/admin.py`.
 *
 * Neither has a changelist: `SingletonModel` forces `pk=1` and blocks delete,
 * and Django's `SingletonModelAdmin` sent the changelist straight to that row.
 * `/admin/hiring-profile` is that record's form.
 */

export const hiringProfileForm: AdminFormModel = {
  key: "hiring-profile",
  from: openhireHiringprofile,
  pk: openhireHiringprofile.id,
  label: () => "Hiring profile",
  canCreate: false,
  canDelete: false,
  fieldsets: [
    {
      fields: [
        {
          name: "companyName",
          column: openhireHiringprofile.companyName,
          label: "Company",
          kind: "text",
          maxLength: 255,
        },
        {
          name: "hiringStatus",
          column: openhireHiringprofile.hiringStatus,
          label: "Status",
          kind: "text",
          maxLength: 100,
        },
        { name: "website", column: openhireHiringprofile.website, label: "Website", kind: "url", maxLength: 200 },
        {
          name: "companyDescription",
          column: openhireHiringprofile.companyDescription,
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
          column: openhireHiringprofile.contactEmail,
          label: "Email",
          kind: "email",
          maxLength: 254,
        },
        {
          name: "contactApplicationEmail",
          column: openhireHiringprofile.contactApplicationEmail,
          label: "Applications to",
          kind: "email",
          maxLength: 254,
        },
        {
          name: "contactResponseTime",
          column: openhireHiringprofile.contactResponseTime,
          label: "Response time",
          kind: "text",
          maxLength: 255,
        },
      ],
    },
    {
      title: "How it works",
      fields: [
        {
          name: "applicationProcess",
          column: openhireHiringprofile.applicationProcess,
          label: "Application process",
          kind: "string-list",
          multiline: true,
          itemLabel: "step",
          help: "Rendered as numbered steps, so the order is what a reader follows.",
        },
        {
          name: "companyCulture",
          column: openhireHiringprofile.companyCulture,
          label: "Culture",
          kind: "string-list",
          multiline: true,
          itemLabel: "value",
        },
        {
          name: "requirementsGeneral",
          column: openhireHiringprofile.requirementsGeneral,
          label: "General requirements",
          kind: "string-list",
          multiline: true,
          itemLabel: "requirement",
        },
        {
          name: "requirementsTechnical",
          column: openhireHiringprofile.requirementsTechnical,
          label: "Technical requirements",
          kind: "string-list",
          multiline: true,
          itemLabel: "requirement",
        },
      ],
    },
  ],
  inlines: [
    {
      name: "positions",
      table: openhirePosition,
      pk: openhirePosition.id,
      parent: openhirePosition.hiringProfileId,
      title: "Open positions",
      itemLabel: "position",
      orderColumn: openhirePosition.order,
      fields: [
        { name: "title", column: openhirePosition.title, label: "Title", kind: "text", required: true, maxLength: 255 },
        {
          name: "type",
          column: openhirePosition.type,
          label: "Employment",
          kind: "select",
          choices: EMPLOYMENT_TYPE_CHOICES,
          maxLength: 100,
        },
        { name: "location", column: openhirePosition.location, label: "Location", kind: "text", maxLength: 255 },
        {
          name: "salaryRange",
          column: openhirePosition.salaryRange,
          label: "Salary range",
          kind: "text",
          maxLength: 100,
        },
        {
          name: "experienceRequired",
          column: openhirePosition.experienceRequired,
          label: "Experience",
          kind: "text",
          maxLength: 255,
        },
        {
          name: "skillsRequired",
          column: openhirePosition.skillsRequired,
          label: "Skills",
          kind: "string-list",
          itemLabel: "skill",
        },
        {
          name: "responsibilities",
          column: openhirePosition.responsibilities,
          label: "Responsibilities",
          kind: "string-list",
          multiline: true,
          itemLabel: "responsibility",
        },
        {
          name: "benefits",
          column: openhirePosition.benefits,
          label: "Benefits",
          kind: "string-list",
          multiline: true,
          itemLabel: "benefit",
        },
      ],
    },
  ],
};

export const openToWorkProfileForm: AdminFormModel = {
  key: "open-to-work-profile",
  from: openhireOpentoworkprofile,
  pk: openhireOpentoworkprofile.id,
  label: () => "Open to work profile",
  canCreate: false,
  canDelete: false,
  fieldsets: [
    {
      fields: [
        { name: "status", column: openhireOpentoworkprofile.status, label: "Status", kind: "text", maxLength: 100 },
        {
          name: "availability",
          column: openhireOpentoworkprofile.availability,
          label: "Availability",
          kind: "text",
          maxLength: 100,
        },
        {
          name: "experienceLevel",
          column: openhireOpentoworkprofile.experienceLevel,
          label: "Experience level",
          kind: "text",
          maxLength: 100,
        },
        {
          name: "noticePeriod",
          column: openhireOpentoworkprofile.noticePeriod,
          label: "Notice period",
          kind: "text",
          maxLength: 100,
        },
        {
          name: "salaryExpectation",
          column: openhireOpentoworkprofile.salaryExpectation,
          label: "Salary expectation",
          kind: "text",
          maxLength: 100,
        },
        {
          name: "workAuthorization",
          column: openhireOpentoworkprofile.workAuthorization,
          label: "Work authorization",
          kind: "text",
          maxLength: 100,
        },
      ],
    },
    {
      title: "What you are open to",
      fields: [
        {
          /*
           * A `jsonb` list holding the same words `Experience.employment_type`
           * holds as a single value. The column cannot carry `choices`, so the
           * vocabulary is applied at the form -- which is exactly what Django's
           * `ChoiceListField` did, and why one existed.
           */
          name: "type",
          column: openhireOpentoworkprofile.type,
          label: "Employment types",
          kind: "choice-list",
          choices: EMPLOYMENT_TYPE_CHOICES,
        },
        {
          name: "locationTypes",
          column: openhireOpentoworkprofile.locationTypes,
          label: "Work arrangements",
          kind: "choice-list",
          choices: LOCATION_TYPE_CHOICES,
        },
        { name: "remote", column: openhireOpentoworkprofile.remote, label: "Open to remote", kind: "checkbox" },
        {
          name: "relocation",
          column: openhireOpentoworkprofile.relocation,
          label: "Open to relocation",
          kind: "checkbox",
        },
        {
          name: "preferredRoles",
          column: openhireOpentoworkprofile.preferredRoles,
          label: "Preferred roles",
          kind: "string-list",
          itemLabel: "role",
        },
        {
          name: "preferredLocations",
          column: openhireOpentoworkprofile.preferredLocations,
          label: "Preferred locations",
          kind: "string-list",
          itemLabel: "location",
        },
        {
          name: "remoteLocations",
          column: openhireOpentoworkprofile.remoteLocations,
          label: "Remote from",
          kind: "string-list",
          itemLabel: "location",
        },
      ],
    },
    {
      title: "About you",
      fields: [
        {
          /*
           * Free text, not the Skill catalogue: one stored value ("REST APIs")
           * has no matching `Skill` row, which is why this never became an M2M
           * the way `Profile.skills_highlight` did.
           */
          name: "skillsHighlight",
          column: openhireOpentoworkprofile.skillsHighlight,
          label: "Skills",
          kind: "string-list",
          itemLabel: "skill",
          help: "Free text rather than the skill catalogue.",
        },
        {
          name: "languages",
          column: openhireOpentoworkprofile.languages,
          label: "Languages",
          kind: "string-list",
          itemLabel: "language",
        },
        {
          name: "showAllToolsSkills",
          column: openhireOpentoworkprofile.showAllToolsSkills,
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
          column: openhireOpentoworkprofile.contactPreference,
          label: "Preferred contact",
          kind: "text",
          maxLength: 100,
        },
        {
          name: "interviewAvailability",
          column: openhireOpentoworkprofile.interviewAvailability,
          label: "Interview availability",
          kind: "text",
          maxLength: 255,
        },
        {
          name: "additionalNotes",
          column: openhireOpentoworkprofile.additionalNotes,
          label: "Notes",
          kind: "textarea",
        },
      ],
    },
  ],
  inlines: [
    {
      name: "highlights",
      table: openhirePortfoliohighlight,
      pk: openhirePortfoliohighlight.id,
      parent: openhirePortfoliohighlight.openToWorkProfileId,
      title: "Portfolio highlights",
      itemLabel: "highlight",
      orderColumn: openhirePortfoliohighlight.order,
      fields: [
        {
          name: "title",
          column: openhirePortfoliohighlight.title,
          label: "Title",
          kind: "text",
          required: true,
          maxLength: 255,
        },
        {
          name: "description",
          column: openhirePortfoliohighlight.description,
          label: "Description",
          kind: "textarea",
        },
      ],
    },
  ],
};
