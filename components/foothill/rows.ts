/**
 * Content records shaped for the site's list rows.
 *
 * A plain module, so a server page builds the rows and hands a client list
 * only what it draws -- never the whole record, whose HTML bodies would ride
 * along in the payload for nothing.
 */

import type { WorkRow } from "@/components/foothill/work-index";
import type { MonthYear } from "@/lib/data/format";
import type { BlogPost, Project } from "@/lib/data/content";
import { displayLabel, postCategory, readingMinutes, yearOf } from "@/lib/site/display";

export function workRow(project: Project): WorkRow {
  return {
    slug: project.slug,
    title: project.title,
    headline: project.headline,
    category: displayLabel(project.category),
    year: yearOf(project.created_at),
    status: project.status_label,
    statusColor: project.status_color,
    image: project.image_url ?? null,
    imageAlt: project.image_alts?.[0] || `${project.title}, a screenshot`,
  };
}

/**
 * The projects the owner has chosen to lead with, in the order chosen.
 *
 * `featured_priority` is the editorial order; a featured project without one
 * goes after those with one, in the listing's own order.
 */
export function featuredProjects(projects: Project[]): Project[] {
  return projects
    .filter((project) => project.is_featured)
    .map((project, index) => ({ project, index }))
    .sort(
      (a, b) =>
        (a.project.featured_priority ?? Infinity) - (b.project.featured_priority ?? Infinity) ||
        a.index - b.index,
    )
    .map(({ project }) => project);
}

export type PostRow = {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: Date;
  minutes: number;
  views: number;
};

export function postRow(post: BlogPost): PostRow {
  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    category: postCategory(post.category),
    date: post.created_at,
    minutes: readingMinutes(post.read_time, post.content_html),
    views: post.views,
  };
}

/** "Jan 2023", for a role's start. */
export function monthYearLabel(value: MonthYear | null | undefined): string {
  if (!value) return "";
  return `${value.month.slice(0, 3)} ${value.year}`;
}
