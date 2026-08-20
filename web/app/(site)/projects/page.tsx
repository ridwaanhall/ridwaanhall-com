import type { Metadata } from "next";

import { getAboutData } from "@/lib/data/about";
import { getProjects, sortProjects } from "@/lib/data/content";
import { projectsListSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { projectsListSchemas } from "@/lib/seo/schemas-for-page";
import { JsonLdScript } from "@/components/seo/json-ld";

export async function generateMetadata(): Promise<Metadata> {
  const [about, projects] = await Promise.all([getAboutData(), getProjects()]);
  if (!about) return {};
  // Sorted before being passed: the social image is the *first* project in
  // display order, not the lowest id, and the keyword set is drawn from the
  // first ten as they actually appear.
  return buildMetadata(projectsListSeo(about, sortProjects(projects)), about);
}

export default async function ProjectsPage() {
  const [about, projects] = await Promise.all([getAboutData(), getProjects()]);
  if (!about) return null;
  const sorted = sortProjects(projects);

  return (
    <>
      <JsonLdScript schemas={projectsListSchemas(about, sorted)} />
      <main className="px-4 py-6 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold text-white">Projects</h1>
          <p className="mt-2 text-zinc-400">Not migrated yet.</p>
        </div>
      </main>
    </>
  );
}
