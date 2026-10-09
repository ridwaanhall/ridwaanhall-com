import type { Metadata, Route } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { MAIN } from "@/components/foothill/layout";
import { PageMotion } from "@/components/foothill/motion";
import { projectView } from "@/components/foothill/rows";
import { CardsSkeleton, InlineSkeleton } from "@/components/foothill/skeleton";
import { PageHead } from "@/components/foothill/ui";
import { WorkExplorer } from "@/components/foothill/work";
import { JsonLdScript } from "@/components/seo/json-ld";
import { getAboutData } from "@/lib/data/about";
import { getProjects, searchProjects, sortProjects, type Project } from "@/lib/data/content";
import { projectsListSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { projectsListSchemas } from "@/lib/seo/schemas-for-page";
import { parseFilters } from "@/lib/site/work-filters";

type WorkParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  const [about, projects] = await Promise.all([getAboutData(), getProjects()]);
  if (!about) return {};
  return buildMetadata(projectsListSeo(about, sortProjects(projects), 1), about);
}

/** The request-dependent half: reading the address makes this part dynamic. */
async function Explorer({ projects, searchParams }: { projects: Project[]; searchParams: WorkParams }) {
  const initial = parseFilters(await searchParams);
  return (
    <WorkExplorer
      projects={projects.map(projectView)}
      initial={initial}
      serverMatches={initial.q ? searchProjects(projects, initial.q).map((project) => project.slug) : null}
    />
  );
}

export default async function ProjectsPage({ searchParams }: { searchParams: WorkParams }) {
  const [about, all] = await Promise.all([getAboutData(), getProjects()]);
  if (!about) return null;

  const sorted = sortProjects(all);
  const newest = [...sorted].sort((a, b) => (b.created_at?.getTime() ?? 0) - (a.created_at?.getTime() ?? 0))[0];

  return (
    <main className={MAIN}>
      <JsonLdScript schemas={projectsListSchemas(about, sorted)} />
      <div>
        <PageHead
          title="Things I have built, and keep building."
          lead="APIs other developers lean on, dashboards, machine-learning models, a few stores and the occasional experiment."
          markdown="/projects"
          facts={[
            ["Projects", sorted.length],
            ["Live to try", sorted.filter((project) => project.demo_url).length],
            ["With source", sorted.filter((project) => project.github_url).length],
            [
              "Newest",
              newest ? (
                <Link className="ul" href={`/projects/${newest.slug}` as Route}>
                  {newest.title}
                </Link>
              ) : (
                "None yet"
              ),
            ],
          ]}
        />
        <section className="wrap" style={{ paddingBottom: 72 }}>
          {/* The cards are titled at the third level, so the list needs a
              second-level heading above them for the outline not to skip. */}
          <h2 className="sr">All projects</h2>
          <Suspense
            fallback={
              <InlineSkeleton label="Loading the projects">
                <CardsSkeleton count={6} />
              </InlineSkeleton>
            }
          >
            <Explorer projects={sorted} searchParams={searchParams} />
          </Suspense>
        </section>
      </div>
      <PageMotion />
    </main>
  );
}
