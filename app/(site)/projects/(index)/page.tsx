import type { Metadata } from "next";
import { Suspense } from "react";

import { MAIN, WRAP } from "@/components/foothill/layout";
import { ProjectResults } from "@/components/foothill/listing";
import { CountUp, PageMotion } from "@/components/foothill/motion";
import { ResultsSkeleton } from "@/components/foothill/skeleton";
import { PageHead } from "@/components/foothill/ui";
import { JsonLdScript } from "@/components/seo/json-ld";
import { getAboutData } from "@/lib/data/about";
import { getProjects, sortProjects } from "@/lib/data/content";
import { projectsListSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { projectsListSchemas } from "@/lib/seo/schemas-for-page";
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

  return (
    <main className={MAIN}>
      <JsonLdScript schemas={projectsListSchemas(about, sorted)} />
      <div className={WRAP}>
        <PageHead
          title="Things I have built, and keep building."
          lead="APIs other developers lean on, dashboards, machine-learning models, a few stores and the occasional experiment."
        >
          <p data-fh-enter className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-[15px] text-mute">
            <span>
              <CountUp value={sorted.length} className="font-display text-[22px] font-medium text-ink" /> projects
            </span>
            <span>
              <CountUp value={live} className="font-display text-[22px] font-medium text-ink" /> live to try
            </span>
          </p>
        </PageHead>
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
