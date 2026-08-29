import { eq } from "drizzle-orm";

import { lookupOr } from "@/lib/admin/sql";
import {
  category,
  project,
  projectFeature,
  projectImage,
  projectSkill,
  projectStatus,
  projectTag,
  skill,
  tag,
} from "@/lib/db/app-schema";

import type { AdminFormModel } from "@/lib/admin/form";
import type { AdminListModel } from "@/lib/admin/list";

/**
 * The `projects` changelist and form.
 *
 * Status, category and tags used to be strings on the row: a status key the
 * cards translated through a hard-coded map, a `category` varchar holding 55
 * values for 64 projects (most of them comma-separated tag lists), and a JSONB
 * array of tags where `Python` and `python` were different tags. All three are
 * rows now, so the label a reader sees and the value the admin offers come from
 * the same place.
 */

/** The status and category labels, read through their foreign key. */
const statusLabel = lookupOr(projectStatus.label, projectStatus.id, project.statusId, "");
const categoryLabel = lookupOr(category.label, category.id, project.categoryId, "");
export type ProjectRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  isFeatured: boolean;
  featuredPriority: number | null;
};

export const projectList: AdminListModel<ProjectRow> = {
  key: "project",
  from: project,
  pk: project.id,
  select: {
    id: project.id,
    title: project.title,
    slug: project.slug,
    status: statusLabel,
    isFeatured: project.isFeatured,
    featuredPriority: project.featuredPriority,
  },
  columns: [
    { key: "title", label: "Title", sort: project.title, value: (row) => row.title },
    { key: "slug", label: "Slug", kind: "code", sort: project.slug, value: (row) => row.slug },
    {
      key: "status",
      label: "Status",
      kind: "muted",
      sort: statusLabel,
      // The label comes from `project_status`, which is the same row the cards
      // read -- there is no map to keep in step any more.
      value: (row) => row.status,
    },
    {
      key: "is_featured",
      label: "Featured",
      kind: "bool",
      sort: project.isFeatured,
      value: (row) => row.isFeatured,
    },
    {
      key: "featured_priority",
      label: "Priority",
      kind: "number",
      sort: project.featuredPriority,
      value: (row) => row.featuredPriority,
    },
  ],
  filters: [
    {
      key: "status",
      label: "Status",
      kind: "choice",
      column: project.statusId,
      choices: { table: projectStatus, value: projectStatus.id, label: projectStatus.label },
    },
    { key: "is_featured", label: "Featured", kind: "boolean", column: project.isFeatured },
  ],
  search: {
    fields: [project.title, project.headline, categoryLabel],
    placeholder: "Search title, headline or category",
  },
  // `ordering = ["id"]` on the model. 64 rows is past the point of scrolling for
  // one, so the list opens on the title.
  defaultSort: { key: "title", dir: "asc" },
  rowId: (row) => row.id,
};

export const projectForm: AdminFormModel = {
  key: "project",
  from: project,
  pk: project.id,
  label: (values) => String(values.title ?? "Project"),
  deleteWarning: "The features, the gallery and the tech-stack links go with it.",
  cascades: [
    // The join table is keyed by its pair of foreign keys, so its own
    // `projectId` is what a cascade deletes by.
    { table: projectSkill, fk: projectSkill.projectId, pk: projectSkill.projectId },
  ],
  fieldsets: [
    {
      fields: [
        {
          name: "title",
          column: project.title,
          label: "Title",
          kind: "text",
          required: true,
          maxLength: 255,
        },
        {
          name: "slug",
          column: project.slug,
          label: "Slug",
          kind: "slug",
          maxLength: 255,
          slugFrom: "title",
          help: "Part of the published URL. Changing it moves the project.",
        },
        {
          name: "headline",
          column: project.headline,
          label: "Headline",
          kind: "text",
          maxLength: 500,
          help: "The one-line summary on the card, and the page's meta description.",
        },
        {
          name: "categoryId",
          column: project.categoryId,
          label: "Category",
          kind: "reference",
          reference: {
            table: category,
            value: category.id,
            label: category.label,
            where: eq(category.kind, "project"),
          },
        },
        {
          name: "statusId",
          column: project.statusId,
          label: "Status",
          kind: "reference",
          required: true,
          reference: { table: projectStatus, value: projectStatus.id, label: projectStatus.label },
        },
        {
          name: "tags",
          column: project.id,
          label: "Tags",
          kind: "many-to-many",
          manyToMany: {
            join: projectTag,
            ownerFk: projectTag.projectId,
            targetFk: projectTag.tagId,
            options: { table: tag, value: tag.id, label: tag.label },
          },
        },
      ],
    },
    {
      title: "Description",
      fields: [
        {
          name: "descriptionHtml",
          column: project.descriptionHtml,
          label: "Description",
          kind: "rich-text",
        },
      ],
    },
    {
      title: "Tech stack",
      help: "A plain many-to-many: unlike the profile's highlighted skills, the order here does not matter.",
      fields: [
        {
          name: "techStack",
          // The field writes to a join table rather than to a column, so this
          // names the project's own key: `toColumns` skips it, and
          // `saveManyToMany` does the writing.
          column: project.id,
          label: "Skills",
          kind: "many-to-many",
          manyToMany: {
            join: projectSkill,
            ownerFk: projectSkill.projectId,
            targetFk: projectSkill.skillId,
            options: { table: skill, value: skill.id, label: skill.name },
          },
        },
      ],
    },
    {
      title: "Links",
      fields: [
        {
          name: "githubUrl",
          column: project.githubUrl,
          label: "Repository",
          kind: "url",
          maxLength: 200,
        },
        { name: "demoUrl", column: project.demoUrl, label: "Demo", kind: "url", maxLength: 200 },
      ],
    },
    {
      title: "Placement",
      fields: [
        {
          name: "isFeatured",
          column: project.isFeatured,
          label: "Featured",
          kind: "checkbox",
          help: "Featured projects lead the home page, in priority order.",
        },
        {
          name: "featuredPriority",
          column: project.featuredPriority,
          label: "Priority",
          kind: "number",
          min: 0,
        },
      ],
    },
  ],
  inlines: [
    {
      name: "features",
      table: projectFeature,
      pk: projectFeature.id,
      parent: projectFeature.projectId,
      title: "Features",
      itemLabel: "feature",
      orderColumn: projectFeature.position,
      fields: [
        {
          name: "title",
          column: projectFeature.title,
          label: "Title",
          kind: "text",
          required: true,
          maxLength: 255,
        },
        {
          name: "description",
          column: projectFeature.description,
          label: "Description",
          kind: "textarea",
        },
      ],
    },
    {
      name: "images",
      table: projectImage,
      pk: projectImage.id,
      parent: projectImage.projectId,
      title: "Gallery",
      help: "Shown in this order, and the first is the card image.",
      itemLabel: "image",
      orderColumn: projectImage.position,
      fields: [
        {
          name: "mediaId",
          column: projectImage.mediaId,
          label: "File",
          kind: "image",
          prefix: "project",
          required: true,
        },
      ],
    },
  ],
};
