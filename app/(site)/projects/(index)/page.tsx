import type { Metadata } from "next";
import { Suspense } from "react";

import { MAIN, WRAP } from "@/components/foothill/layout";
import { ProjectResults, ResultsSkeleton } from "@/components/foothill/listing";
import { PageMotion } from "@/components/foothill/page-motion";
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

  return (
    <main className={MAIN}>
      <JsonLdScript schemas={projectsListSchemas(about, sorted)} />
      <div className={WRAP}>
        <PageHead
          eyebrow={`Work · ${sorted.length}`}
          title="Things I have built, and keep building."
          lead="APIs other developers lean on, dashboards, machine-learning models, a few stores and the occasional experiment."
        />
        <div className="mt-16 md:mt-20">
          {/* `searchParams` makes this half dynamic; the heading above stays
              in the static shell. */}
          <Suspense fallback={<ResultsSkeleton rowHeight={81} />}>
            <ProjectResults projects={sorted} searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
      <PageMotion />
    </main>
  );
}
