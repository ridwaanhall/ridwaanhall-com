import Image, { getImageProps } from "next/image";
import Link from "next/link";

import { HoverPreviewList } from "@/components/motion/hover-preview";
import { ArrowFx, HoverDim, LineText, MediaHover, SpreadText } from "@/components/motion/interactive";
import { Reveal } from "@/components/motion/reveal";
import type { BlogPost, BlogSummary, Project, ProjectSummary } from "@/lib/data/content";
import { localIconUrl } from "@/lib/utils/icon-url";
import { isoDateTime, longDate, slugify } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

/**
 * How the blog and the projects are listed, everywhere they are listed.
 *
 * The site used to show both as photo cards: a 350px tile per post with its
 * text laid over a scrim on the cover. That made every listing a wall of
 * competing images whose text sat on whatever the photo happened to be.
 *
 * Posts are now **rows**: date, title, summary, tags -- text first, read like a
 * table of contents -- with the cover following the pointer on hover where
 * there is a pointer to follow. Projects stay visual, because a project is
 * something to look at, but as an image with a caption beneath it rather than
 * a bordered card with badges stamped on the screenshot.
 *
 * Nothing is ruled off. Rows are separated by their own padding and the date
 * column's rhythm; dates, read times and tags are set in mono, as the traces
 * they are, so the titles are the only thing at reading size.
 */

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-400";

/** An optimised URL for the hover preview, chosen on the server. */
function previewSrc(src: string | null | undefined): string | undefined {
  if (!src) return undefined;
  return getImageProps({ src, alt: "", width: 640, height: 427 }).props.src;
}

export function BlogList({
  posts,
  className,
}: {
  posts: (BlogPost | BlogSummary)[];
  className?: string;
}) {
  return (
    <HoverPreviewList className={className}>
      {/* A list read by scanning: the rows not pointed at step back. */}
      <HoverDim as="ul">
        {posts.map((post) => (
          <BlogRow key={post.slug} post={post} />
        ))}
      </HoverDim>
    </HoverPreviewList>
  );
}

export function BlogRow({ post }: { post: BlogPost | BlogSummary }) {
  const tags = post.tags.map(String);
  return (
    <Reveal as="li">
      <Link
        href={`/blog/${post.slug}`}
        data-preview={previewSrc(post.image_url)}
        data-dim-item=""
        className={cn(
          "group grid grid-cols-1 gap-x-10 gap-y-2 rounded-2xl py-6 md:grid-cols-[9rem_1fr_auto] md:py-7",
          FOCUS,
        )}
      >
        <time dateTime={isoDateTime(post.created_at)} className="type-meta pt-1.5 text-zinc-500">
          {longDate(post.created_at)}
        </time>
        <div className="min-w-0">
          <h3 className="type-item text-zinc-100">
            <LineText>{post.title}</LineText>
          </h3>
          {post.description && (
            <p className="mt-2 line-clamp-2 max-w-2xl text-[0.9375rem] leading-relaxed text-pretty text-zinc-400">
              {post.description}
            </p>
          )}
          {tags.length > 0 && (
            <p className="type-meta mt-3 flex flex-wrap gap-x-3 gap-y-1 text-zinc-500">
              {tags.slice(0, 4).map((tag) => (
                <span key={tag}>#{slugify(tag)}</span>
              ))}
              {tags.length > 4 && <span>+{tags.length - 4}</span>}
            </p>
          )}
        </div>
        <span className="type-meta hidden items-start gap-2 pt-1.5 whitespace-nowrap text-zinc-500 md:flex">
          {post.read_time ? `${post.read_time} min read` : null}
          <ArrowFx direction="right" className="mt-[0.2em] h-3 w-3 text-zinc-400" />
        </span>
      </Link>
    </Reveal>
  );
}

/** A project's lifecycle: a dot in its colour and the word. Never colour alone. */
export function ProjectStatus({ label, color }: { label: string; color: string }) {
  if (!label) return null;
  return (
    <span className="type-meta inline-flex items-center gap-1.5 text-zinc-400">
      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[color] ?? "bg-zinc-500")} aria-hidden="true" />
      {label}
    </span>
  );
}

/*
 * Written out in full rather than composed from the token: Tailwind only emits
 * a class it can see. The token comes from `project_status.color`, checked
 * against the same list by `project_status_color_check`.
 */
const STATUS_DOT: Record<string, string> = {
  purple: "bg-purple-400",
  violet: "bg-violet-400",
  indigo: "bg-indigo-400",
  blue: "bg-blue-400",
  sky: "bg-sky-400",
  cyan: "bg-cyan-400",
  teal: "bg-teal-400",
  emerald: "bg-emerald-400",
  green: "bg-green-400",
  lime: "bg-lime-400",
  yellow: "bg-yellow-400",
  amber: "bg-amber-400",
  orange: "bg-orange-400",
  red: "bg-red-400",
  rose: "bg-rose-400",
  pink: "bg-pink-400",
  fuchsia: "bg-fuchsia-400",
  zinc: "bg-zinc-400",
};

const VISIBLE_TECH = 5;

export function ProjectGrid({
  projects,
  eagerCount = 2,
}: {
  projects: (Project | ProjectSummary)[];
  eagerCount?: number;
}) {
  return (
    <ul className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2">
      {projects.map((project, index) => (
        <ProjectTile key={project.slug} project={project} eager={index < eagerCount} />
      ))}
    </ul>
  );
}

export function ProjectTile({
  project,
  eager = false,
}: {
  project: Project | ProjectSummary;
  eager?: boolean;
}) {
  const tech = project.tech_stack.filter((t) => t.icon_svg);
  const overflow = project.tech_stack.length - VISIBLE_TECH;

  return (
    <Reveal as="li">
      <Link href={`/projects/${project.slug}`} className={cn("group block rounded-2xl", FOCUS)}>
        <MediaHover className="aspect-[3/2] rounded-xl bg-zinc-900">
          {project.image_url && (
            <Image
              src={project.image_url}
              alt={project.title}
              fill
              sizes="(min-width: 1024px) 460px, (min-width: 640px) 50vw, 100vw"
              loading={eager ? "eager" : "lazy"}
              className="object-cover"
            />
          )}
        </MediaHover>

        <div className="mt-5 flex items-start justify-between gap-4">
          {/* A name to look at, not a line to read: it opens out rather than
              drawing an underline the way a post's title does. */}
          <h3 className="type-item text-zinc-100">
            <SpreadText>{project.title}</SpreadText>
          </h3>
          <ArrowFx direction="up-right" className="mt-1 h-4 w-4 text-zinc-400" />
        </div>
        {project.headline && (
          <p className="mt-2 line-clamp-2 text-[0.9375rem] leading-relaxed text-pretty text-zinc-400">{project.headline}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <ProjectStatus label={project.status ? project.status_label : ""} color={project.status_color} />
          {project.is_featured && <span className="type-meta text-zinc-500">Featured</span>}
          {project.tech_stack.length > 0 && (
            <span className="ml-auto flex items-center gap-2">
              {tech.slice(0, VISIBLE_TECH).map((item) => (
                // eslint-disable-next-line @next/next/no-img-element -- 16px SVG marks
                <img
                  key={item.name}
                  src={localIconUrl(item.icon_svg)}
                  alt={item.name}
                  title={item.name}
                  className="h-4 w-4 opacity-80 transition-opacity group-hover:opacity-100"
                  width={16}
                  height={16}
                  loading="lazy"
                />
              ))}
              {overflow > 0 && (
                <span className="type-meta text-zinc-500" title={`${overflow} more technologies`}>
                  +{overflow}
                </span>
              )}
            </span>
          )}
        </div>
      </Link>
    </Reveal>
  );
}

/**
 * The featured posts: the first set large, the rest as image tiles beneath.
 *
 * This replaced an auto-advancing slider. A carousel shows one post at a time
 * and moves while it is being read; laid out, all of them are visible at once
 * and nothing moves unless the reader scrolls.
 */
export function FeaturedPosts({ posts }: { posts: (BlogPost | BlogSummary)[] }) {
  if (posts.length === 0) return null;
  const [lead, ...rest] = posts;

  return (
    <div className="space-y-14">
      <Reveal as="article">
        <Link
          href={`/blog/${lead.slug}`}
          className={cn("group grid items-end gap-8 rounded-2xl md:grid-cols-[1.4fr_1fr]", FOCUS)}
        >
          <MediaHover className="aspect-[16/10] rounded-xl bg-zinc-900">
            {lead.image_url && (
              <Image
                src={lead.image_url}
                alt={`Featured image for blog: ${lead.title}`}
                fill
                preload
                sizes="(min-width: 1024px) 560px, (min-width: 768px) 58vw, 100vw"
                className="object-cover"
              />
            )}
          </MediaHover>
          <div>
            <p className="type-meta text-zinc-500">
              <time dateTime={isoDateTime(lead.created_at)}>{longDate(lead.created_at)}</time>
              {lead.read_time ? ` · ${lead.read_time} min read` : null}
            </p>
            <h3 className="mt-3 type-section text-zinc-100">
              <LineText>{lead.title}</LineText>
            </h3>
            {lead.description && (
              <p className="mt-4 line-clamp-3 type-lead text-zinc-400">{lead.description}</p>
            )}
          </div>
        </Link>
      </Reveal>

      {rest.length > 0 && (
        <ul
          className={cn(
            "grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2",
            rest.length === 3 && "lg:grid-cols-3",
            rest.length >= 4 && "lg:grid-cols-4",
          )}
        >
          {rest.map((post) => (
            <Reveal as="li" key={post.slug}>
              <Link href={`/blog/${post.slug}`} className={cn("group block rounded-2xl", FOCUS)}>
                <MediaHover className="aspect-[3/2] rounded-xl bg-zinc-900">
                  {post.image_url && (
                    <Image
                      src={post.image_url}
                      alt={`Featured image for blog: ${post.title}`}
                      fill
                      sizes="(min-width: 1024px) 220px, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  )}
                </MediaHover>
                <p className="type-meta mt-4 text-zinc-500">
                  <time dateTime={isoDateTime(post.created_at)}>{longDate(post.created_at)}</time>
                </p>
                <h3 className="mt-1.5 line-clamp-3 text-base font-[560] leading-snug text-balance text-zinc-100">
                  <LineText>{post.title}</LineText>
                </h3>
              </Link>
            </Reveal>
          ))}
        </ul>
      )}
    </div>
  );
}
