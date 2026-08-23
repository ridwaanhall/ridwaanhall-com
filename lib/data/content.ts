import { asc, desc, eq, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/lib/db/client";
import {
  blogImage,
  blogPost,
  blogTag,
  category,
  mediaAsset,
  project,
  projectFeature,
  projectImage,
  projectSkill,
  projectStatus,
  projectTag,
  skill,
  tag,
} from "@/lib/db/app-schema";
import { assetUrl } from "@/lib/storage/media";
import { plainText } from "@/lib/utils/plain-text";

import type { Skill } from "./about";
import { projectStatusRank } from "./project-status";
import { TAGS } from "./tags";

/**
 * Blog posts and projects.
 *
 * The shape here, including the derived image fields, is consumed by the page
 * components, the JSON-LD generator and the sitemap alike -- so it is one
 * definition rather than three that can disagree.
 */

/**
 * The derived single/multi-image fields.
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
  /** A uuid. Sequential ids leaked how much of a thing existed; see drizzle/0005. */
  id: string;
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
  /** A uuid, as everywhere else. */
  id: string;
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
 * Newest first by `created_at`, **with `id` as a tiebreak**.
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

  const [posts, images, tagRows] = await Promise.all([
    db
      .select({
        id: blogPost.id,
        title: blogPost.title,
        slug: blogPost.slug,
        description: blogPost.description,
        contentHtml: blogPost.contentHtml,
        authorName: blogPost.authorName,
        authorUsername: blogPost.authorUsername,
        isFeatured: blogPost.isFeatured,
        readTime: blogPost.readTime,
        views: blogPost.views,
        publishedAt: blogPost.publishedAt,
        updatedAt: blogPost.updatedAt,
        category: category.label,
        authorImageKey: mediaAsset.storageKey,
        authorImageSource: mediaAsset.source,
      })
      .from(blogPost)
      .leftJoin(category, eq(category.id, blogPost.categoryId))
      .leftJoin(mediaAsset, eq(mediaAsset.id, blogPost.authorImageId))
      .orderBy(desc(blogPost.publishedAt), desc(blogPost.id)),
    db
      .select({
        postId: blogImage.postId,
        storageKey: mediaAsset.storageKey,
        source: mediaAsset.source,
        originalFilename: mediaAsset.originalFilename,
      })
      .from(blogImage)
      .innerJoin(mediaAsset, eq(mediaAsset.id, blogImage.mediaId))
      .orderBy(asc(blogImage.position)),
    // Tags are rows now rather than a JSONB array on the post, so the label a
    // reader sees is the one canonical form -- `Python` and `python` were two
    // tags before, and a filter on one missed the other.
    db
      .select({ postId: blogTag.postId, label: tag.label })
      .from(blogTag)
      .innerJoin(tag, eq(tag.id, blogTag.tagId))
      .orderBy(asc(blogTag.position)),
  ]);

  const imagesByPost = groupAssets(images, (row) => row.postId);
  const tagsByPost = collect(tagRows, (row) => row.postId, (row) => row.label);

  return posts.map((post) =>
    withImageCompat<BlogPost>({
      id: post.id,
      title: post.title,
      slug: post.slug,
      description: post.description,
      author: post.authorName,
      username: post.authorUsername,
      author_image: assetUrl(
        post.authorImageKey
          ? { storageKey: post.authorImageKey, source: post.authorImageSource ?? "storage" }
          : null,
      ),
      images: imagesByPost.get(post.id) ?? {},
      created_at: new Date(post.publishedAt),
      updated_at: new Date(post.updatedAt),
      content_html: post.contentHtml,
      tags: tagsByPost.get(post.id) ?? [],
      category: post.category ?? "",
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

  const [projects, images, features, techStack, tagRows] = await Promise.all([
    db
      .select({
        id: project.id,
        title: project.title,
        slug: project.slug,
        headline: project.headline,
        descriptionHtml: project.descriptionHtml,
        githubUrl: project.githubUrl,
        demoUrl: project.demoUrl,
        isFeatured: project.isFeatured,
        featuredPriority: project.featuredPriority,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        category: category.label,
        status: projectStatus.slug,
      })
      .from(project)
      .leftJoin(category, eq(category.id, project.categoryId))
      .leftJoin(projectStatus, eq(projectStatus.id, project.statusId))
      .orderBy(asc(project.createdAt), asc(project.id)),
    db
      .select({
        projectId: projectImage.projectId,
        storageKey: mediaAsset.storageKey,
        source: mediaAsset.source,
        originalFilename: mediaAsset.originalFilename,
      })
      .from(projectImage)
      .innerJoin(mediaAsset, eq(mediaAsset.id, projectImage.mediaId))
      .orderBy(asc(projectImage.position)),
    db
      .select({
        projectId: projectFeature.projectId,
        title: projectFeature.title,
        description: projectFeature.description,
      })
      .from(projectFeature)
      .orderBy(asc(projectFeature.position)),
    db
      .select({
        projectId: projectSkill.projectId,
        name: skill.name,
        description: skill.description,
        category: category.label,
        iconKey: mediaAsset.storageKey,
        iconSource: mediaAsset.source,
      })
      .from(projectSkill)
      .innerJoin(skill, eq(skill.id, projectSkill.skillId))
      .leftJoin(category, eq(category.id, skill.categoryId))
      .leftJoin(mediaAsset, eq(mediaAsset.id, skill.iconId))
      .orderBy(asc(projectSkill.position)),
    db
      .select({ projectId: projectTag.projectId, label: tag.label })
      .from(projectTag)
      .innerJoin(tag, eq(tag.id, projectTag.tagId))
      .orderBy(asc(projectTag.position)),
  ]);

  const imagesByProject = groupAssets(images, (row) => row.projectId);
  const tagsByProject = collect(tagRows, (row) => row.projectId, (row) => row.label);
  const featuresByProject = collect(features, (row) => row.projectId, (row) => ({
    title: row.title,
    description: row.description,
  }));
  const skillsByProject = collect(techStack, (row) => row.projectId, (row) => ({
    name: row.name,
    description: row.description,
    // The icon is a media asset now, so a bundled SVG and an uploaded file
    // resolve through one function -- see `assetUrl`.
    icon_svg: assetUrl(row.iconKey ? { storageKey: row.iconKey, source: row.iconSource ?? "static" } : null),
    category: row.category ?? "",
  }));

  return projects.map((row) =>
    withImageCompat<Project>({
      id: row.id,
      title: row.title,
      slug: row.slug,
      headline: row.headline,
      description_html: row.descriptionHtml,
      features: featuresByProject.get(row.id) ?? [],
      images: imagesByProject.get(row.id) ?? {},
      tech_stack: skillsByProject.get(row.id) ?? [],
      github_url: row.githubUrl,
      demo_url: row.demoUrl,
      category: row.category ?? "",
      tags: tagsByProject.get(row.id) ?? [],
      is_featured: row.isFeatured,
      featured_priority: row.featuredPriority,
      status: row.status ?? "",
      created_at: row.createdAt ? new Date(row.createdAt) : null,
      updated_at: row.updatedAt ? new Date(row.updatedAt) : null,
    }),
  );
}

/**
 * Group child rows under their owner's id, in the order they arrived.
 *
 * Every read path here fans out with `Promise.all` and stitches the children
 * back together in memory rather than issuing a query per parent -- the same
 * shape the old `select_related`/`prefetch_related` pair produced, without the
 * N+1 that a naive port would have had.
 */
function collect<T, V>(rows: T[], ownerId: (row: T) => string, value: (row: T) => V): Map<string, V[]> {
  const grouped = new Map<string, V[]>();
  for (const row of rows) {
    const owner = ownerId(row);
    const bucket = grouped.get(owner);
    if (bucket) bucket.push(value(row));
    else grouped.set(owner, [value(row)]);
  }
  return grouped;
}

function groupAssets<T extends { storageKey: string; source: string; originalFilename: string }>(
  rows: T[],
  ownerId: (row: T) => string,
): Map<string, Record<string, string>> {
  const grouped = new Map<string, Record<string, string>>();
  for (const row of rows) {
    if (!row.storageKey) continue;
    const owner = ownerId(row);
    const bucket = grouped.get(owner) ?? {};
    bucket[row.originalFilename] = assetUrl(row);
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
 * Filtered in memory rather than pushed into SQL, which is the unusual choice
 * and the deliberate one: the lists are small (20 posts, 64 projects) and are
 * already in memory from the cache, so a `WHERE` would add a round trip per
 * keystroke to search data we are already holding. Pagination is applied after
 * this.
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
 * a row -- which a server-rendered card simply never touches, but an API
 * response ships to the browser for nothing.
 *
 * Measured on the live data: dropping them takes the blog list response from
 * 75KB to 12KB and the projects list from 46KB to 16KB. The detail endpoints
 * still return everything.
 *
 * The field lists are exactly what the card components read. Adding a field to a
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
 * A raw `views = views + 1` in SQL, so two concurrent readers cannot each read
 * the old value and write the same new one. It deliberately does *not*
 * revalidate the `blog` tag: doing so on every page view would discard the
 * cached payload constantly. The counter is allowed to lag by up to the cache
 * lifetime, which is the right way round for a view tally.
 */
export async function incrementBlogViews(id: string): Promise<void> {
  await db
    .update(blogPost)
    .set({ views: sql`${blogPost.views} + 1` })
    .where(eq(blogPost.id, id));
}
