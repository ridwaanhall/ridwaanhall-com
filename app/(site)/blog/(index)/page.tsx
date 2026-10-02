import type { Metadata } from "next";
import { Suspense } from "react";

import { JsonLdScript } from "@/components/seo/json-ld";
import { FeaturedPosts } from "@/components/site/content-rows";
import {
  BlogResults,
  ListingSkeleton,
  readListingParams,
  type ListingSearchParams,
} from "@/components/site/listing-results";
import { CONTAINER, PageHeader, Section } from "@/components/site/ui";
import { getAboutData } from "@/lib/data/about";
import { getBlogs, toBlogSummary } from "@/lib/data/content";
import { blogListSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { blogListSchemas } from "@/lib/seo/schemas-for-page";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: ListingSearchParams;
}): Promise<Metadata> {
  const [{ page }, about, blogs] = await Promise.all([
    readListingParams(searchParams),
    getAboutData(),
    getBlogs(),
  ]);
  if (!about) return {};
  // The posts are passed so the keyword set picks up their tags, and the page
  // number so a paginated view gets its own title and canonical instead of
  // declaring itself a duplicate of page 1.
  return buildMetadata(blogListSeo(about, blogs, page), about);
}

export default async function BlogPage({ searchParams }: { searchParams: ListingSearchParams }) {
  const [about, posts] = await Promise.all([getAboutData(), getBlogs()]);
  if (!about) return null;

  // Featured posts head the page regardless of the current search or page --
  // they are an editorial selection, not a result set, so they stay in the
  // static shell.
  const featured = posts.filter((post) => post.is_featured).slice(0, 5).map(toBlogSummary);

  return (
    <>
      <JsonLdScript schemas={blogListSchemas(about, posts)} />
      <main className={CONTAINER}>
        <PageHeader
          title="Blog"
          lead="Not all traces are written in code. Some live here in thoughts, questions, and quiet observations."
        />

        {featured.length > 0 && (
          <Section title="Featured">
            <FeaturedPosts posts={featured} />
          </Section>
        )}

        <Section title="All posts">
          {/* Everything below depends on `?q=` and `?page=`, which are request
              data -- behind a boundary so the shell above still prerenders. */}
          <Suspense fallback={<ListingSkeleton />}>
            <BlogResults posts={posts} searchParams={searchParams} />
          </Suspense>
        </Section>
      </main>
    </>
  );
}
