import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { MAIN, WRAP } from "@/components/foothill/layout";
import { ProjectResults } from "@/components/foothill/listing";
import { CountUp, PageMotion } from "@/components/foothill/motion";
import { ResultsSkeleton } from "@/components/foothill/skeleton";
import { Glance, PageHead } from "@/components/foothill/ui";
import { JsonLdScript } from "@/components/seo/json-ld";
import { getAboutData } from "@/lib/data/about";
import { getProjects, sortProjects } from "@/lib/data/content";
import { projectsListSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { projectsListSchemas } from "@/lib/seo/schemas-for-page";
import { newest } from "@/lib/site/display";
import { readListingParams, type ListingSearchParams } from "@/lib/site/listing";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: ListingSearchParams;
}): Promise<Metadata> {
  const [{ page }, about, projects] = await Promise.all([
    readListingParams(searchParams),
    getAboutData(),
    getProjects(),
  ]);
  if (!about) return {};
  return buildMetadata(projectsListSeo(about, sortProjects(projects), page), about);
}

export default async function ProjectsPage({ searchParams }: { searchParams: ListingSearchParams }) {
  const [about, all] = await Promise.all([getAboutData(), getProjects()]);
  if (!about) return null;

  const sorted = sortProjects(all);
  const live = sorted.filter((project) => project.demo_url).length;
  const latest = newest(sorted);

  return (
    <main className={MAIN}>
      <JsonLdScript schemas={projectsListSchemas(about, sorted)} />
      <div className={WRAP}>
        <PageHead
          title="Things I have built, and keep building."
          lead="APIs other developers lean on, dashboards, machine-learning models, a few stores and the occasional experiment."
          aside={
            <Glance
              items={[
                { label: "Projects", value: <CountUp value={sorted.length} /> },
                { label: "Live to try", value: <CountUp value={live} /> },
                ...(latest
                  ? [{ label: "Newest", value: <Link href={`/projects/${latest.slug}`} className="fh-link">{latest.title}</Link> }]
                  : []),
              ]}
            />
          }
        />
        <div className="mt-16 md:mt-24">
          {/* `searchParams` makes this half dynamic; the heading above stays
              in the static shell. */}
          <Suspense fallback={<ResultsSkeleton />}>
            <ProjectResults projects={sorted} searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
      <PageMotion />
    </main>
  );
}
