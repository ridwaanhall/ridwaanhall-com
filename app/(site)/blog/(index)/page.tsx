import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { META } from "@/components/foothill/classes";
import { Icon } from "@/components/foothill/icons";
import { MAIN, WRAP } from "@/components/foothill/layout";
import { BlogResults } from "@/components/foothill/listing";
import { PageMotion, Reveal } from "@/components/foothill/motion";
import { postCard } from "@/components/foothill/rows";
import { ResultsSkeleton } from "@/components/foothill/skeleton";
import { PageHead } from "@/components/foothill/ui";
import { JsonLdScript } from "@/components/seo/json-ld";
import { getAboutData } from "@/lib/data/about";
import { getBlogs } from "@/lib/data/content";
import { blogListSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { blogListSchemas } from "@/lib/seo/schemas-for-page";
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

  // The post to start with: the newest one the owner has marked as featured,
  // or simply the newest.
  const lead = postCard(posts.find((post) => post.is_featured) ?? posts[0]);

  return (
    <main className={MAIN}>
      <JsonLdScript schemas={blogListSchemas(about, posts)} />
      <div className={WRAP}>
        <PageHead
          title="Mostly about code, sometimes about everything else."
          lead="Building software, keeping open APIs alive, and what I think about away from the keyboard."
        />

        {posts.length > 0 && (
          <Reveal as="section" aria-label="Start here" className="mt-16 md:mt-24">
            <Link href={lead.href as `/blog/${string}`} className="group grid items-end gap-8 lg:grid-cols-12 lg:gap-10">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[18px] bg-raise lg:col-span-7">
                {lead.image && (
                  <Image
                    src={lead.image}
                    alt={lead.imageAlt}
                    fill
                    priority
                    sizes="(min-width: 1024px) 700px, 100vw"
                    className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(.2,.8,.2,1)] group-hover:scale-[1.04]"
                  />
                )}
              </div>
              <div className="lg:col-span-5 lg:pb-2">
                <p className={META}>
                  <span className="text-ink">Start here.</span> {lead.meta.join(", ")}
                </p>
                <h2 className="mt-4 font-display text-[clamp(1.9rem,1.3rem+2.4vw,3.25rem)] leading-[1.02] font-medium tracking-[-0.035em] text-ink">
                  <span className="fh-underline">{lead.title}</span>
                </h2>
                <p className="mt-5 line-clamp-3 text-[17px] leading-relaxed text-mute">{lead.summary}</p>
                <span className="mt-7 inline-flex items-center gap-2 text-[15px] font-medium text-ink">
                  Read it
                  <Icon name="arrow-right" className="transition-transform duration-500 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </Reveal>
        )}

        <section aria-label="All writing" className="mt-24 md:mt-32">
          <Suspense fallback={<ResultsSkeleton />}>
            <BlogResults posts={posts} searchParams={searchParams} />
          </Suspense>
        </section>
      </div>
      <PageMotion />
    </main>
  );
}
