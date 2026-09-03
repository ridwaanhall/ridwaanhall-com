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
  /** A uuid. A sequential id leaks how much of a thing exists. */
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
  /**
   * The status slug, which is what the badge's colour is keyed on, and its
   * label and lifecycle order, which come from the row.
   *
   * Four fields rather than one because they answer four different questions
   * and only the first is stable: `status` is an identifier code can match on,
   * `status_label` is editorial and may be reworded from the admin at any time,
   * `status_rank` is where the status sits in the lifecycle -- also editable,
   * and the thing `sortProjects` orders by -- and `status_color` is the token
   * the badge is drawn from.
   *
   * `status_color` is a *token*, never a class: `purple`, which
   * `projectStatusColor` turns into a pair of utilities. A class carried in a
   * column would produce no rule at all, since Tailwind finds classes by
   * scanning source text.
   */
  status: string;
  status_label: string;
  status_rank: number;
  status_color: string;
  created_at: Date | null;
  updated_at: Date | null;
};

/**
 * Every **published** blog post, newest first.
 *
 * `is_published` is the whole of what decides visibility, and this is the only
 * place the public site asks. Everything downstream resolves through here --
 * the listing, the detail pages, `generateStaticParams`, the sitemap, the JSON
 * API and search -- so a draft is absent from all of them without any of them
 * knowing the column exists.
 *
 * Deliberately not `published_at <= now()`. This is a cached read with a
 * lifetime of days, so a clock comparison inside it is evaluated once when the
 * entry is filled and then frozen: a post scheduled for tomorrow would stay
 * hidden for days after its moment. The flag moves instead, and
 * `app/api/cron/publish` is what moves it.
 *
 * Newest first by `published_at`, **with `id` as a tiebreak**.
 *
 * That is not tidiness. Four posts share the exact timestamp
 * 2025-03-23T17:00:00Z, and ordering by `published_at` alone leaves their
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
      .where(eq(blogPost.isPublished, true))
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
 * Every **published** project, oldest first.
 *
 * Published for the reason `getBlogs` gives above, and by the same single
 * column. The order here is only a stable base: what the site actually shows is
 * `sortProjects` below, which leads on featured, then lifecycle status, then
 * recency. Sorting by a column the rows agree on -- and tie-breaking on `id` --
 * is what keeps that base from shifting under a rewrite.
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
        statusLabel: projectStatus.label,
        statusRank: projectStatus.position,
        statusColor: projectStatus.color,
      })
      .from(project)
      .leftJoin(category, eq(category.id, project.categoryId))
      .leftJoin(projectStatus, eq(projectStatus.id, project.statusId))
      .where(eq(project.isPublished, true))
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
    // The icon is a media asset, so every one resolves through `assetUrl`.
    // The fallback matches the column default and `logoUrl` in `lib/data/about.ts`:
    // a row with no source is an object in the bucket. It used to read "static"
    // back when every icon was a bundled file, which is now exactly backwards.
    icon_svg: assetUrl(row.iconKey ? { storageKey: row.iconKey, source: row.iconSource ?? "storage" } : null),
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
      status_label: row.statusLabel ?? "",
      // Empty, not `zinc`, for a project with no status row at all: that is the
      // case `projectStatusColor`'s own fallback is for, and it is a different
      // grey from the one a status can deliberately choose.
      status_color: row.statusColor ?? "",
      // A project with no status at all sorts after every project that has
      // one, which is where an unknown status has always gone.
      status_rank: row.statusRank ?? Number.MAX_SAFE_INTEGER,
      created_at: row.createdAt ? new Date(row.createdAt) : null,
      updated_at: row.updatedAt ? new Date(row.updatedAt) : null,
    }),
  );
}

/**
 * Group child rows under their owner's id, in the order they arrived.
 *
 * Every read path here fans out with `Promise.all` and stitches the children
 * back together in memory rather than issuing a query per parent, which is
 * what keeps a page of twenty posts at two queries instead of twenty-one.
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
 * Presentation ordering for the projects list: featured projects grouped
 * first, and inside each group ordered by lifecycle status then newest first.
 *
 * The rank comes from `project_status.position`, so the order is the one set
 * on the Project status screen. It used to come from an array in
 * `lib/data/project-status.ts` keyed by an underscored status name, which no
 * row has ever matched -- every project ranked as unknown, and the whole of
 * this function's first sort did nothing.
 */
export function sortProjects(projects: Project[]): Project[] {
  const created = (p: Project) => p.created_at?.getTime() ?? Number.NEGATIVE_INFINITY;
  const byStatusThenDate = [...projects].sort((a, b) => {
    const rank = a.status_rank - b.status_rank;
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
  | "is_featured" | "featured_priority" | "status" | "status_label" | "status_rank"
  | "status_color"
  | "created_at" | "updated_at"
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
    status_label: project.status_label,
    status_rank: project.status_rank,
    status_color: project.status_color,
    created_at: project.created_at,
    updated_at: project.updated_at,
    github_url: project.github_url,
    demo_url: project.demo_url,
    image_url: project.image_url,
    img_name: project.img_name,
  };
}

/**
 * Resolve a slug against an already-built list.
 *
 * A linear scan rather than a query: every caller already holds the whole
 * cached collection, so re-reading one row would only cost a round trip.
 */
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
