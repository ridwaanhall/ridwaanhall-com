/**
 * Content records shaped for the site's cards, rows and filters.
 *
 * A plain module, so a server page builds these and hands a client component
 * only what it draws -- never the whole record, whose HTML bodies would ride
 * along in the payload for nothing.
 */

import type { MonthYear } from "@/lib/data/format";
import type { BlogPost, Project } from "@/lib/data/content";
import { displayLabel, postCategory, readingMinutes, shortDate, yearOf } from "@/lib/site/display";

/** One project, as a card, an index row or a filter sees it. */
export type ProjectView = {
  slug: string;
  title: string;
  headline: string;
  image: string | null;
  imageAlt: string;
  /** The status slug (the identifier) and its label (editorial). */
  status: string;
  statusLabel: string;
  statusRank: number;
  kind: string;
  year: number | null;
  /** "Jul 2025": when it began and when it last changed. */
  started: string;
  updated: string;
  updatedAt: number;
  stack: string[];
  tags: string[];
  demo: string | null;
  source: string | null;
  featured: boolean;
  priority: number | null;
};

/** One post, as a card or a row sees it. */
export type PostView = {
  slug: string;
  title: string;
  summary: string;
  image: string | null;
  imageAlt: string;
  date: string;
  /** When it was written, as a timestamp, for ordering; `date` is only a label. */
  time: number;
  category: string;
  minutes: number;
  views: number;
  tags: string[];
  featured: boolean;
};

const monthOf = (value: Date | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(value)
    : "";

export function projectView(project: Project): ProjectView {
  return {
    slug: project.slug,
    title: project.title,
    headline: project.headline,
    image: project.image_url ?? null,
    imageAlt: project.image_alts?.[0] || `${project.title}, a screenshot`,
    status: project.status,
    statusLabel: project.status_label,
    statusRank: project.status_rank,
    kind: displayLabel(project.category),
    year: yearOf(project.created_at),
    started: monthOf(project.created_at),
    updated: monthOf(project.updated_at ?? project.created_at),
    updatedAt: (project.updated_at ?? project.created_at)?.getTime() ?? 0,
    stack: project.tech_stack.map((skill) => skill.name),
    tags: project.tags.map(String),
    demo: project.demo_url,
    source: project.github_url,
    featured: project.is_featured,
    priority: project.featured_priority,
  };
}

export function postView(post: BlogPost): PostView {
  return {
    slug: post.slug,
    title: post.title,
    summary: post.description,
    image: post.image_list?.[0] ?? null,
    imageAlt: post.image_alts?.[0] || `${post.title}, the cover`,
    date: shortDate(post.created_at),
    time: post.created_at?.getTime() ?? 0,
    category: postCategory(post.category),
    minutes: readingMinutes(post.read_time, post.content_html),
    views: post.views,
    tags: post.tags,
    featured: post.is_featured,
  };
}

/**
 * The projects the owner has chosen to lead with, in the order chosen.
 *
 * `featured_priority` is the editorial order; a featured project without one
 * goes after those with one, in the listing's own order.
 */
export function featuredProjects<T extends { is_featured?: boolean; featured?: boolean; featured_priority?: number | null; priority?: number | null }>(
  projects: T[],
): T[] {
  return projects
    .filter((project) => project.is_featured ?? project.featured)
    .map((project, index) => ({ project, index }))
    .sort(
      (a, b) =>
        (a.project.featured_priority ?? a.project.priority ?? Infinity) -
          (b.project.featured_priority ?? b.project.priority ?? Infinity) || a.index - b.index,
    )
    .map(({ project }) => project);
}

/** Projects not yet finished, most recently changed first. */
const DONE = new Set(["completed", "deployment-released", "maintenance-support", "cancelled"]);
export function inProgress(projects: ProjectView[]): ProjectView[] {
  return projects.filter((project) => !DONE.has(project.status)).sort((a, b) => b.updatedAt - a.updatedAt);
}

/** "Jan 2023", for a role's start. */
export function monthYearLabel(value: MonthYear | null | undefined): string {
  if (!value) return "";
  return `${value.month.slice(0, 3)} ${value.year}`;
}
