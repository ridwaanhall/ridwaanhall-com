import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PostCard } from "@/components/foothill/cards";
import { MAIN } from "@/components/foothill/layout";
import { PageMotion, Reveal } from "@/components/foothill/motion";
import { postView } from "@/components/foothill/rows";
import { InlineSkeleton, RowSkeleton } from "@/components/foothill/skeleton";
import { Button, Empty, Heading, PageHead } from "@/components/foothill/ui";
import { WritingIndex } from "@/components/foothill/writing";
import { JsonLdScript } from "@/components/seo/json-ld";
import { getAboutData } from "@/lib/data/about";
import { featuredBlogs, getBlogs, searchBlogs, type BlogPost } from "@/lib/data/content";
import { blogListSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { blogListSchemas } from "@/lib/seo/schemas-for-page";
import { readListingParams, type ListingSearchParams } from "@/lib/site/listing";

export async function generateMetadata(): Promise<Metadata> {
  const [about, blogs] = await Promise.all([getAboutData(), getBlogs()]);
  if (!about) return {};
  return buildMetadata(blogListSeo(about, blogs, 1), about);
}

/** The request-dependent half: reading `?q=` makes this part dynamic. */
async function Index({ posts, searchParams }: { posts: BlogPost[]; searchParams: ListingSearchParams }) {
  const { query } = await readListingParams(searchParams);
  return (
    <WritingIndex
      posts={posts.map(postView)}
      initialQuery={query}
      serverMatches={query ? searchBlogs(posts, query).map((post) => post.slug) : null}
    />
  );
}

export default async function BlogPage({ searchParams }: { searchParams: ListingSearchParams }) {
  const [about, posts] = await Promise.all([getAboutData(), getBlogs()]);
  if (!about) return null;

  const mostRead = [...posts].sort((a, b) => b.views - a.views)[0];
  const reads = posts.reduce((sum, post) => sum + post.views, 0);
  const featured = featuredBlogs(posts).slice(0, 3).map(postView);

  return (
    <main className={MAIN}>
      <JsonLdScript schemas={blogListSchemas(about, posts)} />
      <div>
        <PageHead
          title="Mostly about code, sometimes about everything else."
          lead="Notes on building APIs and models, guides I wished existed, and things I wanted to think through in writing."
          markdown="/blog"
          facts={[
            ["Posts", posts.length],
            ["Read", `${reads.toLocaleString("en-US")} times`],
            [
              "Most read",
              mostRead ? (
                <Link className="ul" href={`/blog/${mostRead.slug}`}>
                  {mostRead.title}
                </Link>
              ) : (
                "–"
              ),
            ],
            ["Latest", posts[0] ? postView(posts[0]).date : "–"],
          ]}
        />
        {posts.length === 0 ? (
          <section className="wrap" style={{ paddingBottom: 72 }}>
            <Empty
              icon="pen"
              title="Nothing published yet"
              note="Posts appear here newest first, with a search and a filter by topic, once the first one goes out."
              action={
                <Button sm ghost href="/contact" icon="mail">
                  Suggest a topic
                </Button>
              }
            />
          </section>
        ) : (
          <>
            {featured.length > 0 && (
              <section className="wrap sec" style={{ borderTop: 0, paddingTop: 0 }}>
                <Heading title="Start here" count={featured.length} note="Picked as the best way in." />
                <Reveal stagger className="pgrid three">
                  {featured.map((post) => (
                    <PostCard key={post.slug} post={post} />
                  ))}
                </Reveal>
              </section>
            )}
            <section className="wrap sec">
              <Heading title="All writing" count={posts.length} note="Newest first." />
              <Suspense
                fallback={
                  <InlineSkeleton label="Loading the posts">
                    {Array.from({ length: 6 }, (_, i) => (
                      <RowSkeleton key={i} />
                    ))}
                  </InlineSkeleton>
                }
              >
                <Index posts={posts} searchParams={searchParams} />
              </Suspense>
            </section>
          </>
        )}
      </div>
      <PageMotion />
    </main>
  );
}
