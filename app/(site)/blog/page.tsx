import type { Metadata } from "next";
import { Suspense } from "react";

import { JsonLdScript } from "@/components/seo/json-ld";
import { FeaturedSlider } from "@/components/site/featured-slider";
import {
  BlogResults,
  ListingSkeleton,
  readListingParams,
  type ListingSearchParams,
} from "@/components/site/listing-results";
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
      <main className="px-4 py-6 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-8 relative z-10">
            <FeaturedSlider posts={featured} />

            <div className="mt-4 sm:mt-6 mb-4 sm:mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-6">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-medium mb-2 tracking-tight">
                    Latest <span className="text-indigo-400">Blogs</span>
                  </h1>
                  <p className="mt-1 sm:mt-2 text-sm sm:text-base md:text-lg leading-relaxed">
                    Not all traces are written in code. Some live here in thoughts, questions, and
                    quiet observations.
                  </p>
                </div>
              </div>
            </div>

            {/* Everything below depends on `?q=` and `?page=`, which are request
                data -- behind a boundary so the shell above still prerenders. */}
            <Suspense fallback={<ListingSkeleton />}>
              <BlogResults posts={posts} searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </main>
    </>
  );
}
