import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { VerifiedIcon } from "@/components/icons/nav-icons";
import { JsonLdScript } from "@/components/seo/json-ld";
import {
  CommentSectionFor,
  CommentSectionSkeleton,
} from "@/components/site/comments/mount";
import { MediaGallery } from "@/components/site/media-gallery";
import { ShareRow } from "@/components/site/share-row";
import { ViewCounter } from "@/components/site/view-counter";
import { getAboutData } from "@/lib/data/about";
import { findBySlug, getBlogs } from "@/lib/data/content";
import { SITE_URL } from "@/lib/seo/config";
import { blogDetailSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { blogDetailSchemas } from "@/lib/seo/schemas-for-page";
import { isoDateTime, longDateTime, slugify } from "@/lib/utils/format";
import { PAGE_GUTTER } from "@/lib/ui/shapes";
import { prepareArticle } from "@/lib/utils/toc";
import { TocNav } from "@/components/site/ui/toc-nav";
import { RailLayout } from "@/components/site/ui/rail";
import { ArticleBody } from "@/components/site/ui/article-body";

/**
 * Prerender every known slug.
 *
 * Not only a performance win: under Cache Components a dynamic segment is URL
 * data, so a layout that reads `usePathname()` -- which the navbar does, to
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
  // One pass: the body is sanitised and its headings are given ids, and the
  // list of those headings becomes the rail. The ids cannot come from the
  // content -- the sanitiser strips every `id` before this runs.
  const { html: body, headings } = prepareArticle(post.content_html);

  return (
    <>
      <JsonLdScript schemas={blogDetailSchemas(about, post)} />
      <article>
        <main className={PAGE_GUTTER}>
          <div>
            <header className="mb-header">
              <h1 className="text-page font-medium tracking-tight text-balance">{post.title}</h1>

              <div className="mt-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 md:gap-3">
                  {post.author_image && (
                    <Image
                      src={post.author_image}
                      alt={post.author}
                      width={50}
                      height={50}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full"
                    />
                  )}
                  <div className="flex flex-col">
                    <a
                      href="https://bio.ridwaanhall.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center underline hover:text-zinc-200 hover:underline transition-colors duration-200 w-fit"
                    >
                      <span className="font-medium">{post.author}</span>
                      <VerifiedIcon className="text-blue-400 ml-1" height={18} width={18} />
                    </a>
                    <div className="text-meta text-zinc-400">
                      <time dateTime={isoDateTime(post.created_at)}>
                        {longDateTime(post.created_at)}
                      </time>
                      {edited && (
                        <>
                          <span className="mx-1">•</span>
                          <span className="text-zinc-400 italic">
                            Edited {longDateTime(post.updated_at)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/blog"
                    className="icon-btn cursor-pointer"
                    aria-label="Back to blog"
                    title="Back to blog"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      fill="currentColor"
                      viewBox="0 0 48 48"
                      className="text-zinc-300"
                      aria-hidden="true"
                    >
                      <path d="m3.88 21.88 15.3-15.3a1 1 0 0 1 1.4 0L23.4 9.4a1 1 0 0 1-.02 1.43L12.74 21H43a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H12.74l10.64 10.17a1 1 0 0 1 .02 1.43l-2.81 2.81a1 1 0 0 1-1.42 0L3.87 26.12a3 3 0 0 1 0-4.24Z" />
                    </svg>
                    <span className="sr-only">Back to blog</span>
                  </Link>

                  <div className="w-px h-6 bg-zinc-600 mx-1 mt-1" />

                  <ShareRow url={url} title={post.title} description={post.description} />
                </div>
              </div>

              <MediaGallery
                images={post.image_list ?? []}
                names={post.image_names ?? []}
                alts={post.image_alts ?? []}
                alt={post.title}
                variant="blog"
                className="mb-6 md:mb-8"
              />
            </header>

            <RailLayout rail={<TocNav headings={headings} />}>
              {/*
                One HTML body, styled entirely by element from styles/prose.css.
                No class name reaches it from the database: see the allow-list in
                lib/utils/sanitize.ts, and scripts/check-db-classes.mjs, which
                proves it against live content. It goes through `ArticleBody`
                rather than `RichText` because the heading ids are added after
                that sanitising pass and a second one would strip them out.
              */}
              <ArticleBody html={body} className="mb-section" />

              <footer>
                <h2 className="mb-stack text-section font-medium">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map(String).map((tag) => (
                    <span
                      key={tag}
                      className="pill-badge border border-zinc-800 px-2.5 py-1 font-mono text-caption text-zinc-400"
                    >
                      #{slugify(tag)}
                    </span>
                  ))}
                </div>
              </footer>

              {/*
                Comments read the session cookie and uncached rows, so they sit
                behind a boundary -- under `cacheComponents` an uncached read
                outside one stops the whole route prerendering, and the article
                above it should not wait on them either.
              */}
              <Suspense fallback={<CommentSectionSkeleton />}>
                <CommentSectionFor label="blog_post" targetId={post.id} slug={post.slug} />
              </Suspense>
            </RailLayout>

            <ViewCounter slug={post.slug} />
          </div>
        </main>
      </article>
    </>
  );
}
