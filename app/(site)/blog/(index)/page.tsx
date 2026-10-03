import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EYEBROW } from "@/components/foothill/classes";
import { MAIN, WRAP } from "@/components/foothill/layout";
import { BlogResults, ResultsSkeleton } from "@/components/foothill/listing";
import { PageMotion } from "@/components/foothill/page-motion";
import { Reveal } from "@/components/foothill/reveal";
import { postRow } from "@/components/foothill/rows";
import { PageHead } from "@/components/foothill/ui";
import { JsonLdScript } from "@/components/seo/json-ld";
import { getAboutData } from "@/lib/data/about";
import { getBlogs } from "@/lib/data/content";
import { blogListSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { blogListSchemas } from "@/lib/seo/schemas-for-page";
import { shortDate } from "@/lib/site/display";
import { readListingParams, type ListingSearchParams } from "@/lib/site/listing";

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
  return buildMetadata(blogListSeo(about, blogs, page), about);
}

export default async function BlogPage({ searchParams }: { searchParams: ListingSearchParams }) {
  const [about, posts] = await Promise.all([getAboutData(), getBlogs()]);
  if (!about) return null;

  const featured = posts.filter((post) => post.is_featured).slice(0, 3).map(postRow);

  return (
    <main className={MAIN}>
      <JsonLdScript schemas={blogListSchemas(about, posts)} />
      <div className={WRAP}>
        <PageHead
          eyebrow={`Writing · ${posts.length}`}
          title="Mostly about code, sometimes about everything else."
          lead="Building software, keeping open APIs alive, and what I think about away from the keyboard."
        />

        {featured.length > 0 && (
          <section aria-labelledby="featured-title" className="mt-16 md:mt-24">
            <h2 id="featured-title" className={`${EYEBROW} border-t border-line pt-4`}>
              Start with these
            </h2>
            <Reveal as="ul" stagger className="mt-8 grid gap-10 md:grid-cols-3 md:gap-8">
              {featured.map((post) => (
                <li key={post.slug}>
                  <Link href={`/blog/${post.slug}`} className="group block">
                    <p className="fh-mono text-[11px] text-mute">
                      {shortDate(post.date)} · {post.minutes} min
                    </p>
                    <p className="mt-3 text-[clamp(1.375rem,1.15rem+0.9vw,1.875rem)] leading-[1.12] font-medium tracking-[-0.025em] text-ink decoration-sulfur-mark decoration-2 underline-offset-[6px] group-hover:underline">
                      {post.title}
                    </p>
                    <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-mute">{post.description}</p>
                  </Link>
                </li>
              ))}
            </Reveal>
          </section>
        )}

        <section aria-label="All writing" className="mt-20 md:mt-28">
          <Suspense fallback={<ResultsSkeleton rowHeight={117} />}>
            <BlogResults posts={posts} searchParams={searchParams} />
          </Suspense>
        </section>
      </div>
      <PageMotion />
    </main>
  );
}
