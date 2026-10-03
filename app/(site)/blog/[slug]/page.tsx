import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EYEBROW } from "@/components/foothill/classes";
import { Gallery } from "@/components/foothill/gallery";
import { MAIN, MEASURE, WRAP } from "@/components/foothill/layout";
import { PageMotion } from "@/components/foothill/page-motion";
import { ReadingProgress } from "@/components/foothill/reading-progress";
import { Share } from "@/components/foothill/share";
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
  // Posts are newest first, so the one after this in the list is the one
  // written before it.
  const at = posts.findIndex((entry) => entry.slug === post.slug);
  const older = posts[at + 1];

  return (
    <main className={MAIN}>
      <JsonLdScript schemas={blogDetailSchemas(about, post)} />
      <div className={WRAP}>
        <article>
          <header className="mx-auto max-w-[880px]">
            <p data-fh-enter className="fh-mono flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-mute">
              <Link href="/blog" className="text-ink hover:text-sulfur">
                ← Writing
              </Link>
              <span className="text-line">/</span>
              <span>{postCategory(post.category)}</span>
            </p>
            <h1
              data-fh-split
              className="mt-8 text-[clamp(2.25rem,1.5rem+3.4vw,4.25rem)] leading-[1.04] font-medium tracking-[-0.035em] text-ink"
            >
              {post.title}
            </h1>
            {post.description && (
              <p data-fh-enter className="fh-serif mt-6 text-[clamp(1.2rem,1.05rem+0.6vw,1.5rem)] leading-[1.45] text-mute">
                {post.description}
              </p>
            )}
            <div data-fh-enter className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-line py-4">
              <span className="flex items-center gap-3">
                {post.author_image && (
                  <Image
                    src={post.author_image}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                )}
                <span className="text-[14px] text-ink">{post.author}</span>
              </span>
              <span className="fh-mono flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-mute">
                <time dateTime={isoDateTime(post.created_at)}>{shortDate(post.created_at)}</time>
                <span>{minutes} min read</span>
                <span>{post.views.toLocaleString("en-US")} views</span>
                {edited && <span>Edited {shortDate(post.updated_at)}</span>}
              </span>
            </div>
          </header>

          {post.image_list && post.image_list.length > 0 && (
            <div data-fh-enter className="mx-auto mt-12 max-w-[1104px]">
              <Gallery images={post.image_list} alts={post.image_alts} title={post.title} layout="cover" eager />
            </div>
          )}

          <div id="post-body" className={`mx-auto mt-14 ${MEASURE}`}>
            <RichText html={post.content_html} className="fh-prose" />

            {post.tags.length > 0 && (
              <ul className="mt-14 flex flex-wrap gap-2" aria-label="Tags">
                {post.tags.map((tag) => (
                  <li key={tag}>
                    <Link
                      href={`/blog?q=${encodeURIComponent(tag)}`}
                      className="fh-mono inline-block rounded-full border border-line px-3 py-1 text-[11px] text-mute transition-colors hover:border-ink hover:text-ink"
                    >
                      {tag}
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

        {older && (
          <nav aria-label="Keep reading" className={`mx-auto mt-20 ${MEASURE}`}>
            <p className={EYEBROW}>Written before this</p>
            <Link href={`/blog/${older.slug}`} className="group mt-3 block">
              <span className="text-[clamp(1.375rem,1.15rem+0.9vw,1.875rem)] leading-tight font-medium tracking-[-0.025em] text-ink decoration-sulfur-mark decoration-2 underline-offset-[6px] group-hover:underline">
                {older.title}
              </span>
              <span className="mt-2 block text-[15px] text-mute">{older.description}</span>
            </Link>
          </nav>
        )}

        <div className={`mx-auto mt-20 ${MEASURE}`}>
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
