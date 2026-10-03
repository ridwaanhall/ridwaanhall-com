/**
 * Content records shaped for the site's cards.
 *
 * A plain module, so a server page builds the cards and hands a client grid
 * only what it draws -- never the whole record, whose HTML bodies would ride
 * along in the payload for nothing.
 */

import type { MonthYear } from "@/lib/data/format";
import type { BlogPost, Project } from "@/lib/data/content";
import { displayLabel, postCategory, readingMinutes, shortDate, yearOf } from "@/lib/site/display";

/** One project or one post, as a card draws it. */
export type Card = {
  key: string;
  href: string;
  title: string;
  summary: string;
  image: string | null;
  imageAlt: string;
  /** Small facts under the title, in reading order. */
  meta: string[];
  status?: { label: string; color: string };
};

export function projectCard(project: Project): Card {
  const year = yearOf(project.created_at);
  return {
    key: project.slug,
    href: `/projects/${project.slug}`,
    title: project.title,
    summary: project.headline,
    image: project.image_url ?? null,
    imageAlt: project.image_alts?.[0] || `${project.title}, a screenshot`,
    meta: [displayLabel(project.category), year ? String(year) : ""].filter(Boolean),
    status: project.status_label ? { label: project.status_label, color: project.status_color } : undefined,
  };
}

export function postCard(post: BlogPost): Card {
  return {
    key: post.slug,
    href: `/blog/${post.slug}`,
    title: post.title,
    summary: post.description,
    image: post.image_list?.[0] ?? null,
    imageAlt: post.image_alts?.[0] || post.title,
    meta: [
      shortDate(post.created_at),
      postCategory(post.category),
      `${readingMinutes(post.read_time, post.content_html)} min read`,
    ],
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

/** "Jan 2023", for a role's start. */
export function monthYearLabel(value: MonthYear | null | undefined): string {
  if (!value) return "";
  return `${value.month.slice(0, 3)} ${value.year}`;
}
