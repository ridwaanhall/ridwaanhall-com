import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";

import { VerifiedIcon } from "@/components/icons/nav-icons";
import { Reveal, SplitHeading } from "@/components/motion/reveal";
import { JsonLdScript } from "@/components/seo/json-ld";
import {
  CommentSectionFor,
  CommentSectionSkeleton,
} from "@/components/site/comments/mount";
import { MediaGallery } from "@/components/site/media-gallery";
import { RichText } from "@/components/site/rich-text";
import { ShareRow } from "@/components/site/share-row";
import { BackLink, CONTAINER, Dot } from "@/components/site/ui";
import { ViewCounter } from "@/components/site/view-counter";
import { getAboutData } from "@/lib/data/about";
import { findBySlug, getBlogs } from "@/lib/data/content";
import { SITE_URL } from "@/lib/seo/config";
import { blogDetailSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { blogDetailSchemas } from "@/lib/seo/schemas-for-page";
import { isoDateTime, longDateTime, slugify } from "@/lib/utils/format";

/**
 * Prerender every known slug.
 *
 * Not only a performance win: under Cache Components a dynamic segment is URL
 * data, so a layout that reads `usePathname()` -- which the sidebar does, to
 * mark the current nav item -- cannot be prerendered for an unknown param.
 * Enumerating the slugs gives each page a concrete path at build time and the
 * whole shell prerenders, instead of the nav streaming in and flashing empty.
 */
export async function generateStaticParams() {
  const posts = await getBlogs();
  return posts.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [about, post] = await Promise.all([
    getAboutData(),
    getBlogs().then((posts) => findBySlug(posts, slug)),
  ]);
  if (!about || !post) return {};
  return buildMetadata(blogDetailSeo(post, about), about);
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [about, post] = await Promise.all([
    getAboutData(),
    getBlogs().then((posts) => findBySlug(posts, slug)),
  ]);
  if (!post || !about) notFound();

  // No trailing slash. The port serves `/blog/<slug>` and 308s the slashed
  // form to it, so the copy button was handing out a URL that redirects and did
  // not match what the reader had in the address bar. `canonical_url` in
  // lib/seo/data.ts has always been the unslashed form; this now agrees with it.
  const url = `${SITE_URL}/blog/${post.slug}`;
  // Only call it edited when the timestamps genuinely differ; they are equal on
  // a post that has never been revised.
  const edited = post.updated_at.getTime() > post.created_at.getTime();

  return (
    <>
      <JsonLdScript schemas={blogDetailSchemas(about, post)} />
      <main className={CONTAINER}>
        <article>
          <header className="mx-auto max-w-3xl pt-10 md:pt-16">
            <Reveal>
              <BackLink href="/blog">All posts</BackLink>
            </Reveal>

            <Reveal className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500">
              {post.category && (
                <>
                  <span>{post.category}</span>
                  <Dot />
                </>
              )}
              <time dateTime={isoDateTime(post.created_at)}>{longDateTime(post.created_at)}</time>
              {post.read_time ? (
                <>
                  <Dot />
                  <span>{post.read_time} min read</span>
                </>
              ) : null}
            </Reveal>

            <SplitHeading className="mt-5 text-4xl font-medium leading-[1.08] tracking-tight text-balance text-zinc-100 sm:text-5xl">
              {post.title}
            </SplitHeading>

            {post.description && (
              <Reveal as="p" className="mt-6 text-lg leading-relaxed text-pretty text-zinc-400 sm:text-xl">
                {post.description}
              </Reveal>
            )}

            <Reveal className="mt-10 flex flex-wrap items-center justify-between gap-6 border-y border-zinc-800 py-5">
              <div className="flex items-center gap-3">
                {post.author_image && (
                  <Image
                    src={post.author_image}
                    alt={post.author}
                    width={40}
                    height={40}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                )}
                <div className="flex flex-col">
                  <a
                    href="https://bio.ridwaanhall.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-1 text-sm font-medium text-zinc-100"
                  >
                    <span className="link-draw">{post.author}</span>
                    <VerifiedIcon className="text-zinc-400" height={15} width={15} />
                  </a>
                  {edited ? (
                    <span className="text-xs text-zinc-500">Edited {longDateTime(post.updated_at)}</span>
                  ) : (
                    <span className="text-xs text-zinc-500">@{post.username}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <ShareRow url={url} title={post.title} description={post.description} />
              </div>
            </Reveal>
          </header>

          <Reveal className="mx-auto mt-12 max-w-4xl">
            <MediaGallery
              images={post.image_list ?? []}
              names={post.image_names ?? []}
              alts={post.image_alts ?? []}
              alt={post.title}
              variant="blog"
              className=""
            />
          </Reveal>

          {/*
            One HTML body, styled entirely by element from styles/prose.css.
            No class name reaches this from the database: see the allow-list
            in lib/utils/sanitize.ts, and scripts/check-db-classes.mjs, which
            proves it against live content.
          */}
          <RichText html={post.content_html} className="mx-auto mt-12 max-w-3xl md:mt-16" />

          {post.tags.length > 0 && (
            <footer className="mx-auto mt-12 max-w-3xl border-t border-zinc-800 pt-8">
              <h2 className="sr-only">Tags</h2>
              <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-zinc-500">
                {post.tags.map(String).map((tag) => (
                  <li key={tag}>#{slugify(tag)}</li>
                ))}
              </ul>
            </footer>
          )}

          {/*
            Comments read the session cookie and uncached rows, so they sit
            behind a boundary -- under `cacheComponents` an uncached read
            outside one stops the whole route prerendering, and the article
            above it should not wait on them either.
          */}
          <div className="mx-auto max-w-3xl">
            <Suspense fallback={<CommentSectionSkeleton />}>
              <CommentSectionFor label="blog_post" targetId={post.id} slug={post.slug} />
            </Suspense>
          </div>

          <ViewCounter slug={post.slug} />
        </article>
      </main>
    </>
  );
}
