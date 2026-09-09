import type { Metadata } from "next";
import { Suspense } from "react";

import { JsonLdScript } from "@/components/seo/json-ld";
import {
  ListingSkeleton,
  ProjectResults,
  readListingParams,
  type ListingSearchParams,
} from "@/components/site/listing-results";
import { getAboutData } from "@/lib/data/about";
import { getProjects, sortProjects } from "@/lib/data/content";
import { projectsListSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { projectsListSchemas } from "@/lib/seo/schemas-for-page";
import { PAGE_GUTTER } from "@/lib/ui/shapes";
import { PageHeader } from "@/components/site/ui/page-header";

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
  // Sorted before being passed: the social image is the *first* project in
  // display order, not the lowest id, and the keywords come from the first ten
  // as they actually appear.
  return buildMetadata(projectsListSeo(about, sortProjects(projects), page), about);
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: ListingSearchParams;
}) {
  const [about, all] = await Promise.all([getAboutData(), getProjects()]);
  if (!about) return null;

  // Sorted here rather than in the results component: the order is by lifecycle
  // status and then recency, and it does not depend on the request.
  const sorted = sortProjects(all);

  return (
    <>
      <JsonLdScript schemas={projectsListSchemas(about, sorted)} />
      <main className={PAGE_GUTTER}>
        <div>
          <PageHeader
            title="My Projects"
            lead="Where effort met execution, these projects are artifacts of discipline and continuous learning."
          />

          <Suspense fallback={<ListingSkeleton />}>
            <ProjectResults projects={sorted} searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
    </>
  );
}
