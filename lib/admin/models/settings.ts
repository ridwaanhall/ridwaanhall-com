import { sql, type SQL } from "drizzle-orm";

import { countWhere } from "@/lib/admin/sql";
import {
  application,
  applicationSource,
  applicationStatus,
  availability,
  blogPost,
  blogTag,
  category,
  contactPreference,
  employmentType,
  experience,
  experienceLevel,
  jobOpening,
  legalDocument,
  legalDocumentType,
  noticePeriod,
  openToWorkProfile,
  openToWorkStatus,
  project,
  projectStatus,
  projectTag,
  skill,
  tag,
  workAuthorization,
  workMode,
} from "@/lib/db/app-schema";

import type { AdminFormModel, FormField } from "@/lib/admin/form";
import type { AdminListModel } from "@/lib/admin/list";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

/**
 * The vocabularies every other screen's dropdowns are drawn from.
 *
 * These tables existed before this module did; what did not exist was any way
 * to edit them. A row was reachable as an *option* -- a `reference` field, a
 * changelist filter -- and nowhere else, so adding one meant an `INSERT` typed
 * by hand against production. Two of the sets were not even rows: the legal
 * document types were an array in TypeScript over an unconstrained `text`
 * column, and six of the open-to-work answers were free text on one row, which
 * is a vocabulary with no way to offer it and no way to stop "Mid-Level" and
 * "Mid level" being two answers to the same question.
 *
 * They are fourteen tables of the same four columns, so they are one factory
 * rather than fourteen transcriptions. Fourteen hand-written copies of `slug`,
 * `label` and `position` is exactly the shape that drifts: the eleventh gets a
 * `maxLength` the others do not have and nothing anywhere reports it.
 *
 * `category` and `project-status` are written out below instead, because each
 * needs something the factory deliberately does not offer.
 */

/** What every one of these lists selects. `used` is the reference count. */
export type VocabRow = {
  id: string;
  slug: string;
  label: string;
  position: number;
  used: number;
};

type VocabSpec = {
  /** Registry key, and the URL segment. */
  key: string;
  table: PgTable;
  id: PgColumn;
  slug: PgColumn;
  label: PgColumn;
  /** `application_source` and `tag` have no ordering column. */
  position?: PgColumn;
  /**
   * The foreign keys pointing at this table, counted into the "Used by" column
   * so a row's cost is visible before somebody deletes it.
   */
  usedBy: PgColumn[];
  /** What deleting one takes with it, in the words of this vocabulary. */
  deleteWarning: string;
  /** Sentence under the form, where the set needs explaining. */
  help?: string;
};

const sqlPlus = (a: SQL<number>, b: SQL<number>): SQL<number> => sql<number>`${a} + ${b}`;

/**
 * The counts are summed in SQL rather than in `value`, so the column can be
 * sorted on. A vocabulary referenced from three places -- `employment_type` is
 * -- would otherwise offer a number the header cannot order by, which is the
 * compromise the organizations screen makes and is worth avoiding where the
 * shape allows.
 */
const usage = (columns: PgColumn[], id: PgColumn) =>
  columns.map((column) => countWhere(column, id)).reduce(sqlPlus);

function vocabulary(spec: VocabSpec): {
  list: AdminListModel<VocabRow>;
  form: AdminFormModel;
} {
  const { key, table, id, slug, label, position, usedBy } = spec;
  const used = usage(usedBy, id);

  const list: AdminListModel<VocabRow> = {
    key,
    from: table,
    pk: id,
    select: {
      id,
      slug,
      label,
      // A list without a position column still has to answer for the field,
      // so it reports the constant the ordering would have used.
      position: position ?? sql<number>`0`,
      used,
    },
    columns: [
      { key: "label", label: "Label", sort: label, value: (row) => row.label },
      { key: "slug", label: "Slug", kind: "code", sort: slug, value: (row) => row.slug },
      ...(position
        ? [
            {
              key: "position",
              label: "Order",
              kind: "number" as const,
              sort: position,
              value: (row: VocabRow) => row.position,
            },
          ]
        : []),
      { key: "used", label: "Used by", kind: "number", sort: used, value: (row) => row.used },
    ],
    search: { fields: [label, slug], placeholder: "Search label or slug" },
    // Position first where there is one: these lists are read as an order, not
    // as an alphabet, and the dropdown they feed is drawn in exactly this order.
    defaultSort: position ? { key: "position", dir: "asc" } : { key: "label", dir: "asc" },
    rowId: (row) => row.id,
  };

  const fields: FormField[] = [
    {
      name: "label",
      column: label,
      label: "Label",
      kind: "text",
      required: true,
      maxLength: 100,
      help: spec.help,
    },
    {
      name: "slug",
      column: slug,
      label: "Slug",
      kind: "slug",
      maxLength: 100,
      slugFrom: "label",
      help: "Left blank, this is derived from the label.",
    },
  ];
  if (position) {
    fields.push({
      name: "position",
      column: position,
      label: "Order",
      kind: "number",
      min: 0,
      help: "Lower numbers come first in the dropdown.",
    });
  }

  const form: AdminFormModel = {
    key,
    from: table,
    pk: id,
    label: (values) => String(values.label ?? "Entry"),
    deleteWarning: spec.deleteWarning,
    fieldsets: [{ fields }],
  };

  return { list, form };
}

// --- the plain vocabularies --------------------------------------------------

const applicationStatusVocab = vocabulary({
  key: "application-status",
  table: applicationStatus,
  id: applicationStatus.id,
  slug: applicationStatus.slug,
  label: applicationStatus.label,
  position: applicationStatus.position,
  usedBy: [application.statusId],
  help: "Shown on the application card. Its colour is keyed on the slug, not on this.",
  deleteWarning: "Every application at this status is left with no status at all.",
});

const applicationSourceVocab = vocabulary({
  key: "application-source",
  table: applicationSource,
  id: applicationSource.id,
  slug: applicationSource.slug,
  label: applicationSource.label,
  usedBy: [application.sourceId],
  deleteWarning: "Every application submitted through this is left with no source.",
});

const employmentTypeVocab = vocabulary({
  key: "employment-type",
  table: employmentType,
  id: employmentType.id,
  slug: employmentType.slug,
  label: employmentType.label,
  position: employmentType.position,
  usedBy: [experience.employmentTypeId, application.employmentTypeId, jobOpening.employmentTypeId],
  deleteWarning: "Every role, application and open position on this type is left with none.",
});

const workModeVocab = vocabulary({
  key: "work-mode",
  table: workMode,
  id: workMode.id,
  slug: workMode.slug,
  label: workMode.label,
  position: workMode.position,
  usedBy: [experience.workModeId, application.workModeId],
  deleteWarning: "Every role and application on this work mode is left with none.",
});

const tagVocab = vocabulary({
  key: "tag",
  table: tag,
  id: tag.id,
  slug: tag.slug,
  label: tag.label,
  usedBy: [blogTag.tagId, projectTag.tagId],
  help: "Shared by blog posts and projects, so a subject is spelled one way.",
  deleteWarning: "This tag is removed from every post and project carrying it.",
});

const legalDocumentTypeVocab = vocabulary({
  key: "legal-document-type",
  table: legalDocumentType,
  id: legalDocumentType.id,
  slug: legalDocumentType.slug,
  label: legalDocumentType.label,
  position: legalDocumentType.position,
  usedBy: [legalDocument.typeId],
  // `RESTRICT` on this one, unlike every other vocabulary here: the column is
  // NOT NULL, so there is no "no type" for a document to fall back to and the
  // database refuses the delete rather than inventing one.
  deleteWarning: "A type still used by a legal document cannot be removed.",
});

const openToWorkStatusVocab = vocabulary({
  key: "open-to-work-status",
  table: openToWorkStatus,
  id: openToWorkStatus.id,
  slug: openToWorkStatus.slug,
  label: openToWorkStatus.label,
  position: openToWorkStatus.position,
  usedBy: [openToWorkProfile.statusId],
  deleteWarning: "The open-to-work page shows no status until another is chosen.",
});

const availabilityVocab = vocabulary({
  key: "availability",
  table: availability,
  id: availability.id,
  slug: availability.slug,
  label: availability.label,
  position: availability.position,
  usedBy: [openToWorkProfile.availabilityId],
  deleteWarning: "The open-to-work page shows no availability until another is chosen.",
});

const experienceLevelVocab = vocabulary({
  key: "experience-level",
  table: experienceLevel,
  id: experienceLevel.id,
  slug: experienceLevel.slug,
  label: experienceLevel.label,
  position: experienceLevel.position,
  usedBy: [openToWorkProfile.experienceLevelId],
  deleteWarning: "The open-to-work page shows no experience level until another is chosen.",
});

const noticePeriodVocab = vocabulary({
  key: "notice-period",
  table: noticePeriod,
  id: noticePeriod.id,
  slug: noticePeriod.slug,
  label: noticePeriod.label,
  position: noticePeriod.position,
  usedBy: [openToWorkProfile.noticePeriodId],
  deleteWarning: "The open-to-work page shows no notice period until another is chosen.",
});

const workAuthorizationVocab = vocabulary({
  key: "work-authorization",
  table: workAuthorization,
  id: workAuthorization.id,
  slug: workAuthorization.slug,
  label: workAuthorization.label,
  position: workAuthorization.position,
  usedBy: [openToWorkProfile.workAuthorizationId],
  deleteWarning: "The open-to-work page shows no work authorization until another is chosen.",
});

const contactPreferenceVocab = vocabulary({
  key: "contact-preference",
  table: contactPreference,
  id: contactPreference.id,
  slug: contactPreference.slug,
  label: contactPreference.label,
  position: contactPreference.position,
  usedBy: [openToWorkProfile.contactPreferenceId],
  deleteWarning: "The open-to-work page shows no contact preference until another is chosen.",
});

export const applicationStatusList = applicationStatusVocab.list;
export const applicationStatusForm = applicationStatusVocab.form;
export const applicationSourceList = applicationSourceVocab.list;
export const applicationSourceForm = applicationSourceVocab.form;
export const employmentTypeList = employmentTypeVocab.list;
export const employmentTypeForm = employmentTypeVocab.form;
export const workModeList = workModeVocab.list;
export const workModeForm = workModeVocab.form;
export const tagList = tagVocab.list;
export const tagForm = tagVocab.form;
export const legalDocumentTypeList = legalDocumentTypeVocab.list;
export const legalDocumentTypeForm = legalDocumentTypeVocab.form;
export const openToWorkStatusList = openToWorkStatusVocab.list;
export const openToWorkStatusForm = openToWorkStatusVocab.form;
export const availabilityList = availabilityVocab.list;
export const availabilityForm = availabilityVocab.form;
export const experienceLevelList = experienceLevelVocab.list;
export const experienceLevelForm = experienceLevelVocab.form;
export const noticePeriodList = noticePeriodVocab.list;
export const noticePeriodForm = noticePeriodVocab.form;
export const workAuthorizationList = workAuthorizationVocab.list;
export const workAuthorizationForm = workAuthorizationVocab.form;
export const contactPreferenceList = contactPreferenceVocab.list;
export const contactPreferenceForm = contactPreferenceVocab.form;

// --- project status ----------------------------------------------------------

/**
 * The lifecycle, renameable and reorderable but fixed in extent.
 *
 * `lib/data/project-status.ts` keys a badge colour on the slug, so a status
 * created here would render in the neutral fallback and read as a bug in the
 * card rather than as a status nothing has a colour for. Until a colour is
 * something this screen can set, the honest interface is one that does not
 * offer the row that cannot work: no create, no delete, and a slug that is
 * fixed once the row exists.
 *
 * What it *does* offer is the two things the projects page genuinely reads --
 * `label` on the badge and `position` in the sort -- so renaming "Development
 * In Progress" or moving it up the lifecycle takes effect on save.
 */
const projectStatusUsed = countWhere(project.statusId, projectStatus.id);

export const projectStatusList: AdminListModel<VocabRow> = {
  key: "project-status",
  from: projectStatus,
  pk: projectStatus.id,
  select: {
    id: projectStatus.id,
    slug: projectStatus.slug,
    label: projectStatus.label,
    position: projectStatus.position,
    used: projectStatusUsed,
  },
  columns: [
    { key: "label", label: "Label", sort: projectStatus.label, value: (row) => row.label },
    { key: "slug", label: "Slug", kind: "code", sort: projectStatus.slug, value: (row) => row.slug },
    {
      key: "position",
      label: "Order",
      kind: "number",
      sort: projectStatus.position,
      value: (row) => row.position,
    },
    {
      key: "used",
      label: "Projects",
      kind: "number",
      sort: projectStatusUsed,
      value: (row) => row.used,
    },
  ],
  search: { fields: [projectStatus.label, projectStatus.slug], placeholder: "Search label or slug" },
  defaultSort: { key: "position", dir: "asc" },
  rowId: (row) => row.id,
};

export const projectStatusForm: AdminFormModel = {
  key: "project-status",
  from: projectStatus,
  pk: projectStatus.id,
  label: (values) => String(values.label ?? "Project status"),
  /*
   * Never created here, and deleted only by a superuser.
   *
   * **Create stays refused to everybody.** A badge colour is a pair of Tailwind
   * classes and classes are never stored in the database, so
   * `lib/data/project-status.ts` keys them on the slug. A status created here
   * would have no colour and render in the neutral fallback, which reads as a
   * broken card rather than as a status nobody has picked a colour for -- and
   * that is as true of a row a superuser creates as of any other.
   *
   * **Delete is `"superuser"`.** Removing a status is the one direction that
   * does not produce a colourless badge, and the projects that still name one
   * are protected by the foreign key rather than by this flag: a status in use
   * cannot be deleted by anybody, superuser included. What this opens is the
   * unused row -- a status somebody has finished with -- which previously
   * needed SQL.
   */
  canCreate: false,
  canDelete: "superuser",
  deleteWarning:
    "The colour keyed on this slug in lib/data/project-status.ts is left with nothing to match. Projects still using the status keep it and block the delete.",
  fieldsets: [
    {
      help: "The badge on a project card reads the label; the projects page sorts on the order.",
      fields: [
        {
          name: "label",
          column: projectStatus.label,
          label: "Label",
          kind: "text",
          required: true,
          maxLength: 100,
        },
        {
          name: "slug",
          column: projectStatus.slug,
          label: "Slug",
          kind: "slug",
          readOnly: true,
          help: "The badge's colour is keyed on this, so it is fixed.",
        },
        {
          name: "position",
          column: projectStatus.position,
          label: "Order",
          kind: "number",
          min: 0,
          help: "The lifecycle order the projects page groups by. Lower comes first.",
        },
      ],
    },
  ],
};

// --- category ----------------------------------------------------------------

/**
 * Three vocabularies in one table, told apart by `kind`.
 *
 * `kind` is a structural discriminator with a CHECK constraint behind it, not a
 * vocabulary of its own, so it is spelled out here the way `comment.target_kind`
 * is rather than becoming a fifteenth lookup table. The three sets must not
 * offer each other's terms -- a blog category in a skill's dropdown is a
 * category that would render on the about page as a section nobody wrote --
 * which is what the `where` on each `reference` field enforces.
 */
export const CATEGORY_KIND_CHOICES = [
  { value: "skill", label: "Skill" },
  { value: "project", label: "Project" },
  { value: "blog", label: "Blog" },
];

const categoryUsed = sqlPlus(
  sqlPlus(countWhere(skill.categoryId, category.id), countWhere(project.categoryId, category.id)),
  countWhere(blogPost.categoryId, category.id),
);

export type CategoryRow = VocabRow & { kind: string };

export const categoryList: AdminListModel<CategoryRow> = {
  key: "category",
  from: category,
  pk: category.id,
  select: {
    id: category.id,
    kind: category.kind,
    slug: category.slug,
    label: category.label,
    position: category.position,
    used: categoryUsed,
  },
  columns: [
    { key: "label", label: "Label", sort: category.label, value: (row) => row.label },
    { key: "kind", label: "Kind", sort: category.kind, value: (row) => row.kind },
    { key: "slug", label: "Slug", kind: "code", sort: category.slug, value: (row) => row.slug },
    {
      key: "position",
      label: "Order",
      kind: "number",
      sort: category.position,
      value: (row) => row.position,
    },
    { key: "used", label: "Used by", kind: "number", sort: categoryUsed, value: (row) => row.used },
  ],
  filters: [
    { key: "kind", label: "Kind", kind: "choice", column: category.kind, choices: CATEGORY_KIND_CHOICES },
  ],
  search: { fields: [category.label, category.slug], placeholder: "Search label or slug" },
  // Kind first: the three sets are read one at a time, and interleaving them
  // alphabetically makes a list of 50 that looks like one vocabulary.
  defaultSort: { key: "kind", dir: "asc" },
  rowId: (row) => row.id,
};

export const categoryForm: AdminFormModel = {
  key: "category",
  from: category,
  pk: category.id,
  label: (values) => String(values.label ?? "Category"),
  deleteWarning: "Every skill, project and post in this category is left uncategorised.",
  fieldsets: [
    {
      fields: [
        {
          name: "label",
          column: category.label,
          label: "Label",
          kind: "text",
          required: true,
          maxLength: 100,
        },
        {
          name: "kind",
          column: category.kind,
          label: "Kind",
          kind: "select",
          required: true,
          choices: CATEGORY_KIND_CHOICES,
          help: "Which of the three vocabularies this belongs to. Only its own screens offer it.",
        },
        {
          name: "slug",
          column: category.slug,
          label: "Slug",
          kind: "slug",
          maxLength: 100,
          slugFrom: "label",
          help: "Unique within its kind, so 'design' can exist as both a skill and a project category.",
        },
        {
          name: "position",
          column: category.position,
          label: "Order",
          kind: "number",
          min: 0,
          help: "Lower numbers come first in the dropdown.",
        },
      ],
    },
  ],
};
