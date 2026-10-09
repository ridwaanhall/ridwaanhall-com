import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PostCard } from "@/components/foothill/cards";
import { CopyButton } from "@/components/foothill/controls";
import { MAIN } from "@/components/foothill/layout";
import { PageMotion, Reveal } from "@/components/foothill/motion";
import { ArticleTools, PostContents } from "@/components/foothill/post";
import { postView } from "@/components/foothill/rows";
import { Button, Crumb, Heading, PageHead, TextLink, Thumb } from "@/components/foothill/ui";
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
import { outlineHtml } from "@/lib/utils/outline";
import { sanitizeRichText } from "@/lib/utils/sanitize";

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

  const view = postView(post);
  const url = `${SITE_URL}/blog/${post.slug}`;
  // Posts that share a tag with this one, most shared first, then the newest.
  const related = posts
    .filter((entry) => entry.slug !== post.slug)
    .map((entry, index) => ({ entry, shared: entry.tags.filter((tag) => post.tags.includes(tag)).length, index }))
    .sort((a, b) => b.shared - a.shared || a.index - b.index)
    .slice(0, 3)
    .map(({ entry }) => postView(entry));
  // The post's own sections, for the contents list beside it. The top level
  // only when there are enough of them; a post too short for three is read
  // straight through.
  const { headings } = outlineHtml(sanitizeRichText(post.content_html));
  const top = headings.filter((heading) => heading.level === 2);
  const contents = (top.length >= 3 ? top : headings).map(({ id, label }) => ({ id, label }));
  const share = encodeURIComponent(url);
  const said = encodeURIComponent(post.title);

  return (
    <main className={MAIN}>
      <JsonLdScript schemas={blogDetailSchemas(about, post)} />
      <div>
        <PageHead
          crumb={<Crumb href="/blog">{`Writing · ${view.category}`}</Crumb>}
          title={post.title}
          lead={post.description}
          markdown={`/blog/${post.slug}`}
          facts={[
            ["By", post.author || about.name],
            ["Published", view.date],
            ["Reading time", `${view.minutes} min`],
            ["Views", post.views.toLocaleString("en-US")],
          ]}
        />
        {view.image && (
          <section className="wrap">
            <Thumb src={view.image} alt={view.imageAlt} title={post.title} ratio="16 / 8" priority eye={false} sizes="(min-width: 1200px) 1104px, 100vw" />
          </section>
        )}
        <article className="wrap post-grid">
          {contents.length >= 3 && <PostContents entries={contents} />}
          <div style={{ minWidth: 0 }}>
            <div id="post-body">
              <RichText html={post.content_html} className="article" outline />
            </div>
            <div className="post-foot">
              {post.tags.length > 0 && (
                <div className="sk-list" aria-label="Tags">
                  {post.tags.map((tag) => (
                    <Link key={tag} className="tag" href={`/blog?q=${encodeURIComponent(tag)}`}>
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
              <div className="share">
                <span className="meta" style={{ marginRight: 6 }}>
                  Share
                </span>
                <CopyButton sm text={url} label="Copy link" message="Link copied" />
                <Button sm ghost icon="xlogo" href={`https://x.com/intent/post?url=${share}&text=${said}`}>
                  X
                </Button>
                <Button sm ghost icon="linkedin" href={`https://www.linkedin.com/sharing/share-offsite/?url=${share}`}>
                  LinkedIn
                </Button>
                <Button sm ghost icon="mail" href={`mailto:?subject=${said}&body=${share}`}>
                  Email
                </Button>
              </div>
            </div>
          </div>
        </article>

        <section className="wrap sec">
          <Suspense fallback={<CommentSectionSkeleton />}>
            <CommentSectionFor label="blog_post" targetId={post.id} slug={post.slug} />
          </Suspense>
        </section>

        {related.length > 0 && (
          <section className="wrap sec">
            <Heading title="Related" note="Posts that share a tag with this one.">
              <TextLink href="/blog" icon="book">
                {`All ${posts.length} posts`}
              </TextLink>
            </Heading>
            <Reveal stagger className="pgrid three">
              {related.map((entry) => (
                <PostCard key={entry.slug} post={entry} />
              ))}
            </Reveal>
          </section>
        )}
      </div>
      {/* After the content, not before: the route's skeleton is measured
          against the first block in `<main>`, and these draw nothing there. */}
      <ArticleTools target="#post-body" url={url} />
      <ViewCounter slug={post.slug} />
      <PageMotion />
    </main>
  );
}
