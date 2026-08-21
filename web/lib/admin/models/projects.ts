import { PROJECT_STATUS_CHOICES } from "@/lib/admin/choices";
import { projectsProject } from "@/lib/db/schema";
import { projectStatusDisplay } from "@/lib/data/project-status";

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
