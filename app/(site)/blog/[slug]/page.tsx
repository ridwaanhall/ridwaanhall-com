import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CardGrid } from "@/components/foothill/cards";
import {H1, LEAD } from "@/components/foothill/classes";
import { Gallery } from "@/components/foothill/gallery";
import { MAIN, MEASURE, WRAP } from "@/components/foothill/layout";
import {PageMotion, ReadingProgress } from "@/components/foothill/motion";
import { postCard } from "@/components/foothill/rows";
import { Share } from "@/components/foothill/share";
import { ActionLink, Heading } from "@/components/foothill/ui";
import { JsonLdScript } from "@/components/seo/json-ld";
import { CommentSectionFor, CommentSectionSkeleton } from "@/components/site/comments/mount";
import { RichText } from "@/components/site/rich-text";
import { ViewCounter } from "@/components/site/view-counter";
import { getAboutData } from "@/lib/data/about";
import { findBySlug, getBlogs } from "@/lib/data/content";
import { SITE_URL } from "@/lib/seo/config";
import { blogDetailSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { blogDetailSchemas } from "@/lib/seo/schemas-for-page";
import { postCategory, readingMinutes, shortDate } from "@/lib/site/display";
import { isoDateTime } from "@/lib/utils/format";

export async function generateStaticParams() {
  const posts = await getBlogs();
  return posts.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [about, post] = await Promise.all([getAboutData(), getBlogs().then((posts) => findBySlug(posts, slug))]);
  if (!about || !post) return {};
  return buildMetadata(blogDetailSeo(post, about), about);
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [about, posts] = await Promise.all([getAboutData(), getBlogs()]);
  const post = findBySlug(posts, slug);
  if (!post || !about) notFound();

  const url = `${SITE_URL}/blog/${post.slug}`;
  const edited = post.updated_at.getTime() - post.created_at.getTime() > 24 * 60 * 60 * 1000;
  const minutes = readingMinutes(post.read_time, post.content_html);
  // Posts are newest first: the two after this one were written before it.
  const at = posts.findIndex((entry) => entry.slug === post.slug);
  const earlier = posts.slice(at + 1, at + 3);
  const more = earlier.length ? earlier : posts.filter((entry) => entry.slug !== post.slug).slice(0, 2);

  return (
    <main className={MAIN}>
      <JsonLdScript schemas={blogDetailSchemas(about, post)} />
      <div className={WRAP}>
        <article>
          <header className="mx-auto max-w-[920px]">
            <div data-fh-enter className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-mute">
              <ActionLink href="/blog" icon="arrow-left" className="text-[14px] text-mute hover:text-ink">
                Writing
              </ActionLink>
              <span aria-hidden="true" className="h-3 w-px bg-line" />
              <span>{postCategory(post.category)}</span>
            </div>
            <h1 data-fh-split className={`${H1} mt-8 text-[clamp(2.4rem,1.4rem+4.2vw,5rem)] leading-[0.98]`}>
              {post.title}
            </h1>
            {post.description && (
              <p data-fh-enter className={`${LEAD} mt-7`}>
                {post.description}
              </p>
            )}
            <div data-fh-enter className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
              <span className="flex items-center gap-3">
                {post.author_image && (
                  <span className="fh-print relative h-9 w-9 overflow-hidden rounded-full">
                    <Image src={post.author_image} alt="" fill sizes="36px" className="object-cover" />
                  </span>
                )}
                <span className="text-[15px] font-medium text-ink">{post.author}</span>
              </span>
              <span className="flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-mute">
                <time dateTime={isoDateTime(post.created_at)}>{shortDate(post.created_at)}</time>
                <span>{minutes} min read</span>
                <span>{post.views.toLocaleString("en-US")} views</span>
                {edited && <span>Edited {shortDate(post.updated_at)}</span>}
              </span>
            </div>
          </header>

          {post.image_list && post.image_list.length > 0 && (
            <div data-fh-enter className="mx-auto mt-14 max-w-[1104px]">
              <Gallery images={post.image_list} alts={post.image_alts} title={post.title} layout="cover" eager />
            </div>
          )}

          <div id="post-body" className={`mx-auto mt-16 ${MEASURE}`}>
            <RichText html={post.content_html} className="fh-prose" />

            {post.tags.length > 0 && (
              <ul className="mt-14 flex flex-wrap gap-2" aria-label="Tags">
                {post.tags.map((tag) => (
                  <li key={tag}>
                    <Link
                      href={`/blog?q=${encodeURIComponent(tag)}`}
                      className="inline-block rounded-full bg-raise px-3.5 py-1.5 text-[13px] text-mute transition-colors hover:bg-ink hover:text-paper"
                    >
                      #{tag}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-10 border-t border-line pt-6">
              <Share url={url} title={post.title} />
            </div>
          </div>
        </article>

        {more.length > 0 && (
          <section aria-labelledby="keep-reading" className="mt-28 md:mt-36">
            <Heading id="keep-reading">Keep reading</Heading>
            <CardGrid cards={more.map(postCard)} batch={2} rhythm={false} span="lg:col-span-6" className="mt-12" />
          </section>
        )}

        <div className={`mx-auto mt-24 ${MEASURE}`}>
          <Suspense fallback={<CommentSectionSkeleton />}>
            <CommentSectionFor label="blog_post" targetId={post.id} slug={post.slug} />
          </Suspense>
        </div>
      </div>
      {/* After the content, not before: the route's skeleton is measured
          against the first block in `<main>`, and these draw nothing there. */}
      <ReadingProgress target="#post-body" />
      <ViewCounter slug={post.slug} />
      <PageMotion />
    </main>
  );
}
