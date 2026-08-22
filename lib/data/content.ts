import { asc, desc, eq, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/lib/db/client";
import {
  aboutSkill,
  blogBlogimage,
  blogBlogpost,
  projectsFeature,
  projectsProject,
  projectsProjectTechStack,
  projectsProjectimage,
} from "@/lib/db/schema";
import { mediaUrl } from "@/lib/storage/media";
import { plainText } from "@/lib/utils/plain-text";

import type { Skill } from "./about";
import { projectStatusRank } from "./project-status";
import { TAGS } from "./tags";

/**
 * Blog posts and projects.
 *
 * A port of apps/core/content_manager.py. The dict shapes it produced are kept
 * exactly, including the derived image fields, because they are consumed by the
 * page components, the JSON-LD generator and the sitemap alike.
 */

/**
 * The derived single/multi-image fields, from `_add_image_compat_fields`.
 *
 * `images` is an object keyed by original filename, so the first entry is the
 * card thumbnail and the whole set is the gallery. Insertion order carries the
 * `order` column, so the queries below must stay ordered.
 */
type ImageCompat = {
  images: Record<string, string>;
  image_url?: string;
  img_name?: string;
  image_list?: string[];
  image_names?: string[];
  image_count?: number;
};

function withImageCompat<T extends ImageCompat>(data: T): T {
  const names = Object.keys(data.images);
  if (names.length === 0) return data;
  const urls = Object.values(data.images);
  return {
    ...data,
    image_url: urls[0],
    img_name: names[0],
    image_list: urls,
    image_names: names,
    image_count: names.length,
  };
}

export type BlogPost = ImageCompat & {
  id: number;
  title: string;
  slug: string;
  description: string;
  author: string;
  username: string;
  author_image: string;
  created_at: Date;
  updated_at: Date;
  /** The body as rich-text HTML. */
  content_html: string;
  tags: string[];
  category: string;
  is_featured: boolean;
  read_time: number | null;
  views: number;
};

export type ProjectFeature = { title: string; description: string };

export type Project = ImageCompat & {
  id: number;
  title: string;
  slug: string;
  headline: string;
  /** The description as rich-text HTML. */
  description_html: string;
  features: ProjectFeature[];
  tech_stack: Skill[];
  github_url: string | null;
  demo_url: string | null;
  category: string;
  tags: string[];
  is_featured: boolean;
  featured_priority: number | null;
  status: string;
  created_at: Date | null;
  updated_at: Date | null;
};

/**
 * Every blog post, newest first.
 *
 * Order follows `BlogPost.Meta.ordering = ["-created_at"]`, **with `id` added
 * as a tiebreak**, which Django did not have.
 *
 * That is not tidiness. Four posts share the exact timestamp
 * 2025-03-23T17:00:00Z, and ordering by `created_at` alone leaves their
 * relative order to Postgres' physical row order -- which is not an order at
 * all, just wherever the tuples happen to sit. It is stable only until
 * something rewrites them: adding the `content_html` column and populating it
 * moved all four, and the blog list silently came back in a different sequence.
 * A VACUUM would do the same.
 *
 * Descending `id`, so the tie resolves to "most recently added first", which is
 * what "newest first" means for rows that claim the same instant.
 */
export async function getBlogs(): Promise<BlogPost[]> {
  "use cache";
  cacheTag(TAGS.blog);
  cacheLife("days");

  const [posts, images] = await Promise.all([
    db
      .select()
      .from(blogBlogpost)
      .orderBy(desc(blogBlogpost.createdAt), desc(blogBlogpost.id)),
    db.select().from(blogBlogimage).orderBy(asc(blogBlogimage.order), asc(blogBlogimage.id)),
  ]);

  const imagesByPost = groupImages(images, (row) => row.blogId);
  return posts.map((post) =>
    withImageCompat<BlogPost>({
      id: post.id,
      title: post.title,
      slug: post.slug,
      description: post.description,
      author: post.author,
      username: post.username,
      author_image: mediaUrl(post.authorImage),
      images: imagesByPost.get(post.id) ?? {},
      created_at: new Date(post.createdAt),
      updated_at: new Date(post.updatedAt),
      content_html: post.contentHtml ?? "",
      tags: (post.tags ?? []) as string[],
      category: post.category,
      is_featured: post.isFeatured,
      read_time: post.readTime,
      views: post.views,
    }),
  );
}

/**
 * Every project, by id ascending.
 *
 * Matches `Project.Meta.ordering = ["id"]`, which is what
 * `ContentManager.get_projects()` returned. The presentation orderings that
 * `DataService.get_projects()` layered on top live in `sortProjects` below.
 */
export async function getProjects(): Promise<Project[]> {
  "use cache";
  // `skill` is a real dependency: each project dict embeds whole tech-stack
  // records, so renaming a Skill changes this payload.
  cacheTag(TAGS.project, TAGS.skill);
  cacheLife("days");

  const [projects, images, features, techStack] = await Promise.all([
    db.select().from(projectsProject).orderBy(asc(projectsProject.id)),
    db
      .select()
      .from(projectsProjectimage)
      .orderBy(asc(projectsProjectimage.order), asc(projectsProjectimage.id)),
    db.select().from(projectsFeature).orderBy(asc(projectsFeature.order), asc(projectsFeature.id)),
    db
      .select({ projectId: projectsProjectTechStack.projectId, skill: aboutSkill })
      .from(projectsProjectTechStack)
      .innerJoin(aboutSkill, eq(projectsProjectTechStack.skillId, aboutSkill.id))
      .orderBy(asc(aboutSkill.id)),
  ]);

  const imagesByProject = groupImages(images, (row) => row.projectId);

  const featuresByProject = new Map<number, ProjectFeature[]>();
  for (const feature of features) {
    const entry = { title: feature.title, description: feature.description };
    const bucket = featuresByProject.get(feature.projectId);
    if (bucket) bucket.push(entry);
    else featuresByProject.set(feature.projectId, [entry]);
  }

  const skillsByProject = new Map<number, Skill[]>();
  for (const { projectId, skill } of techStack) {
    const entry: Skill = {
      name: skill.name,
      description: skill.description,
      icon_svg: skill.iconSvg,
      category: skill.category,
    };
    const bucket = skillsByProject.get(projectId);
    if (bucket) bucket.push(entry);
    else skillsByProject.set(projectId, [entry]);
  }

  return projects.map((project) =>
    withImageCompat<Project>({
      id: project.id,
      title: project.title,
      slug: project.slug,
      headline: project.headline,
      description_html: project.descriptionHtml ?? "",
      features: featuresByProject.get(project.id) ?? [],
      images: imagesByProject.get(project.id) ?? {},
      tech_stack: skillsByProject.get(project.id) ?? [],
      github_url: project.githubUrl,
      demo_url: project.demoUrl,
      category: project.category,
      tags: (project.tags ?? []) as string[],
      is_featured: project.isFeatured,
      featured_priority: project.featuredPriority,
      status: project.status,
      created_at: project.createdAt ? new Date(project.createdAt) : null,
      updated_at: project.updatedAt ? new Date(project.updatedAt) : null,
    }),
  );
}

function groupImages<T extends { image: string; originalFilename: string }>(
  rows: T[],
  ownerId: (row: T) => number,
): Map<number, Record<string, string>> {
  const grouped = new Map<number, Record<string, string>>();
  for (const row of rows) {
    if (!row.image) continue;
    const owner = ownerId(row);
    const bucket = grouped.get(owner) ?? {};
    bucket[row.originalFilename] = mediaUrl(row.image);
    grouped.set(owner, bucket);
  }
  return grouped;
}

/**
 * Presentation ordering for the projects list.
 *
 * Ported from `DataService.get_projects(sort_by_featured=True,
 * sort_by_status=True)`, which is what the listing page asks for: featured
 * projects grouped first, and inside each group ordered by lifecycle status
 * then newest first.
 */
export function sortProjects(projects: Project[]): Project[] {
  const created = (p: Project) => p.created_at?.getTime() ?? Number.NEGATIVE_INFINITY;
  const byStatusThenDate = [...projects].sort((a, b) => {
    const rank = projectStatusRank(a.status) - projectStatusRank(b.status);
    return rank !== 0 ? rank : created(b) - created(a);
  });
  return [
    ...byStatusThenDate.filter((p) => p.is_featured),
    ...byStatusThenDate.filter((p) => !p.is_featured),
  ];
}

/** Featured posts for the blog page's slider, newest first, at most five. */
export function featuredBlogs(blogs: BlogPost[]): BlogPost[] {
  return blogs.filter((blog) => blog.is_featured).slice(0, 5);
}

/**
 * Search, ported from the list views.
 *
 * Django filtered the whole cached list in Python on every request. That is
 * kept here rather than pushed into SQL for one reason: the fields searched
 * include `tags`, a JSONB array of free text, and the body, which is HTML; the
 * lists are small (20 posts, 64 projects) and already in memory from the cache.
 * Pushing it to SQL would add a round trip per keystroke to search data we are
 * already holding. Pagination is applied after this.
 */
export function searchBlogs(blogs: BlogPost[], query: string): BlogPost[] {
  const q = query.trim().toLowerCase();
  if (!q) return blogs;
  return blogs.filter(
    (blog) =>
      blog.title.toLowerCase().includes(q) ||
      blog.description.toLowerCase().includes(q) ||
      blog.author.toLowerCase().includes(q) ||
      blog.tags.some((tag) => String(tag).toLowerCase().includes(q)),
  );
}

export function searchProjects(projects: Project[], query: string): Project[] {
  const q = query.trim().toLowerCase();
  if (!q) return projects;
  return projects.filter(
    (project) =>
      project.title.toLowerCase().includes(q) ||
      project.headline.toLowerCase().includes(q) ||
      plainText(project.description_html).toLowerCase().includes(q) ||
      project.category.toLowerCase().includes(q) ||
      project.tags.some((tag) => String(tag).toLowerCase().includes(q)),
  );
}

/**
 * Card-sized projections for the list endpoints.
 *
 * The list pages render cards, and a card reads six or seven fields -- never
 * the body, `features`, or the tech stack, which are by far the largest part of
 * a row. Django had no equivalent because it rendered the cards server-side and
 * simply never touched those keys; over an API they would be shipped to the
 * browser for nothing.
 *
 * Measured on the live data: dropping them takes the blog list response from
 * 75KB to 12KB and the projects list from 46KB to 16KB. The detail endpoints
 * still return everything.
 *
 * The field lists mirror blog/components/card.html, blog/sections/
 * featured_slider.html and projects/components/card.html. Adding a field to a
 * card means adding it here too.
 */
export type BlogSummary = Pick<
  BlogPost,
  | "id" | "title" | "slug" | "description" | "author" | "author_image"
  | "created_at" | "updated_at" | "tags" | "category" | "is_featured"
  | "read_time" | "views" | "image_url" | "img_name"
>;

export function toBlogSummary(blog: BlogPost): BlogSummary {
  return {
    id: blog.id,
    title: blog.title,
    slug: blog.slug,
    description: blog.description,
    author: blog.author,
    author_image: blog.author_image,
    created_at: blog.created_at,
    updated_at: blog.updated_at,
    tags: blog.tags,
    category: blog.category,
    is_featured: blog.is_featured,
    read_time: blog.read_time,
    views: blog.views,
    image_url: blog.image_url,
    img_name: blog.img_name,
  };
}

export type ProjectSummary = Pick<
  Project,
  | "id" | "title" | "slug" | "headline" | "category" | "tags" | "tech_stack"
  | "is_featured" | "featured_priority" | "status" | "created_at" | "updated_at"
  | "github_url" | "demo_url" | "image_url" | "img_name"
>;

export function toProjectSummary(project: Project): ProjectSummary {
  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    headline: project.headline,
    category: project.category,
    tags: project.tags,
    tech_stack: project.tech_stack,
    is_featured: project.is_featured,
    featured_priority: project.featured_priority,
    status: project.status,
    created_at: project.created_at,
    updated_at: project.updated_at,
    github_url: project.github_url,
    demo_url: project.demo_url,
    image_url: project.image_url,
    img_name: project.img_name,
  };
}

/** Resolve a slug against an already-built list, as `DetailView.find_by_slug` did. */
export function findBySlug<T extends { slug: string }>(items: T[], slug: string): T | undefined {
  return items.find((item) => item.slug === slug);
}

/**
 * Increment a post's view counter.
 *
 * A raw `views = views + 1` so concurrent reads cannot lose an increment, the
 * same as Django's `F("views") + 1`. It deliberately does *not* revalidate the
 * `blog` tag: doing so on every page view would discard the cached payload
 * constantly. The counter is allowed to lag by up to the cache lifetime, which
 * is exactly the trade-off `CONTENT_CACHE_TTL` covered before.
 */
export async function incrementBlogViews(id: number): Promise<void> {
  await db
    .update(blogBlogpost)
    .set({ views: sql`${blogBlogpost.views} + 1` })
    .where(eq(blogBlogpost.id, id));
}
