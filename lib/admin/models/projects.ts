import { PROJECT_STATUS_CHOICES } from "@/lib/admin/choices";
import {
  aboutSkill,
  projectsFeature,
  projectsProject,
  projectsProjectimage,
  projectsProjectTechStack,
} from "@/lib/db/schema";
import { projectStatusDisplay } from "@/lib/data/project-status";

import type { AdminFormModel } from "@/lib/admin/form";
import type { AdminListModel } from "@/lib/admin/list";

/** `ProjectAdmin` in `apps/projects/admin.py`. */
export type ProjectRow = {
  id: number;
  title: string;
  slug: string;
  status: string;
  isFeatured: boolean;
  featuredPriority: number | null;
};

export const projectList: AdminListModel<ProjectRow> = {
  key: "project",
  from: projectsProject,
  pk: projectsProject.id,
  select: {
    id: projectsProject.id,
    title: projectsProject.title,
    slug: projectsProject.slug,
    status: projectsProject.status,
    isFeatured: projectsProject.isFeatured,
    featuredPriority: projectsProject.featuredPriority,
  },
  columns: [
    { key: "title", label: "Title", sort: projectsProject.title, value: (row) => row.title },
    { key: "slug", label: "Slug", kind: "code", sort: projectsProject.slug, value: (row) => row.slug },
    {
      key: "status",
      label: "Status",
      kind: "muted",
      sort: projectsProject.status,
      // The column stores a key (`development_in_progress`); the cards show a
      // label ("In Development"). The admin shows the label too, from the same
      // map, so the two surfaces cannot disagree about what a status is called.
      value: (row) => projectStatusDisplay(row.status),
    },
    {
      key: "is_featured",
      label: "Featured",
      kind: "bool",
      sort: projectsProject.isFeatured,
      value: (row) => row.isFeatured,
    },
    {
      key: "featured_priority",
      label: "Priority",
      kind: "number",
      sort: projectsProject.featuredPriority,
      value: (row) => row.featuredPriority,
    },
  ],
  filters: [
    {
      key: "status",
      label: "Status",
      kind: "choice",
      column: projectsProject.status,
      choices: PROJECT_STATUS_CHOICES,
    },
    { key: "is_featured", label: "Featured", kind: "boolean", column: projectsProject.isFeatured },
  ],
  search: {
    fields: [projectsProject.title, projectsProject.headline, projectsProject.category],
    placeholder: "Search title, headline or category",
  },
  // `ordering = ["id"]` on the model. 64 rows is past the point of scrolling for
  // one, so the list opens on the title.
  defaultSort: { key: "title", dir: "asc" },
  rowId: (row) => row.id,
};

export const projectForm: AdminFormModel = {
  key: "project",
  from: projectsProject,
  pk: projectsProject.id,
  label: (values) => String(values.title ?? "Project"),
  deleteWarning: "The features, the gallery and the tech-stack links go with it.",
  // `description` is the original JSONB paragraph list, kept until cutover so the
  // Django admin keeps working. The body is edited as HTML in `description_html`.
  insertDefaults: () => ({ description: [] }),
  cascades: [
    { table: projectsProjectTechStack, fk: projectsProjectTechStack.projectId, pk: projectsProjectTechStack.id },
  ],
  fieldsets: [
    {
      fields: [
        {
          name: "title",
          column: projectsProject.title,
          label: "Title",
          kind: "text",
          required: true,
          maxLength: 255,
        },
        {
          name: "slug",
          column: projectsProject.slug,
          label: "Slug",
          kind: "slug",
          maxLength: 255,
          slugFrom: "title",
          help: "Part of the published URL. Changing it moves the project.",
        },
        {
          name: "headline",
          column: projectsProject.headline,
          label: "Headline",
          kind: "text",
          maxLength: 500,
          help: "The one-line summary on the card, and the page's meta description.",
        },
        {
          name: "category",
          column: projectsProject.category,
          label: "Category",
          kind: "text",
          maxLength: 255,
        },
        {
          name: "status",
          column: projectsProject.status,
          label: "Status",
          kind: "select",
          required: true,
          choices: PROJECT_STATUS_CHOICES,
          maxLength: 32,
        },
        {
          name: "tags",
          column: projectsProject.tags,
          label: "Tags",
          kind: "string-list",
          itemLabel: "tag",
        },
      ],
    },
    {
      title: "Description",
      fields: [
        {
          name: "descriptionHtml",
          column: projectsProject.descriptionHtml,
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
          column: projectsProject.id,
          label: "Skills",
          kind: "many-to-many",
          manyToMany: {
            join: projectsProjectTechStack,
            ownerFk: projectsProjectTechStack.projectId,
            targetFk: projectsProjectTechStack.skillId,
            options: { table: aboutSkill, value: aboutSkill.id, label: aboutSkill.name },
          },
        },
      ],
    },
    {
      title: "Links",
      fields: [
        {
          name: "githubUrl",
          column: projectsProject.githubUrl,
          label: "Repository",
          kind: "url",
          maxLength: 200,
        },
        { name: "demoUrl", column: projectsProject.demoUrl, label: "Demo", kind: "url", maxLength: 200 },
      ],
    },
    {
      title: "Placement",
      fields: [
        {
          name: "isFeatured",
          column: projectsProject.isFeatured,
          label: "Featured",
          kind: "checkbox",
          help: "Featured projects lead the home page, in priority order.",
        },
        {
          name: "featuredPriority",
          column: projectsProject.featuredPriority,
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
      table: projectsFeature,
      pk: projectsFeature.id,
      parent: projectsFeature.projectId,
      title: "Features",
      itemLabel: "feature",
      orderColumn: projectsFeature.order,
      fields: [
        {
          name: "title",
          column: projectsFeature.title,
          label: "Title",
          kind: "text",
          required: true,
          maxLength: 255,
        },
        {
          name: "description",
          column: projectsFeature.description,
          label: "Description",
          kind: "textarea",
        },
      ],
    },
    {
      name: "images",
      table: projectsProjectimage,
      pk: projectsProjectimage.id,
      parent: projectsProjectimage.projectId,
      title: "Gallery",
      help: "Shown in this order, and the first is the card image.",
      itemLabel: "image",
      orderColumn: projectsProjectimage.order,
      fields: [
        {
          name: "image",
          column: projectsProjectimage.image,
          label: "File",
          kind: "image",
          prefix: "project",
          required: true,
        },
        {
          name: "originalFilename",
          column: projectsProjectimage.originalFilename,
          label: "Caption",
          kind: "text",
          maxLength: 255,
        },
      ],
    },
  ],
};
