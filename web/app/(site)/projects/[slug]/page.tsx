import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAboutData } from "@/lib/data/about";
import { findBySlug, getProjects } from "@/lib/data/content";
import { projectDetailSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";

/**
 * Prerender every known slug.
 *
 * Not only a performance win: under Cache Components a dynamic segment is URL
 * data, so a layout that reads `usePathname()` -- which the sidebar does, to
 * mark the current nav item -- cannot be prerendered for an unknown param.
 * Enumerating the slugs gives each page a concrete path at build time and the
 * whole shell prerenders. The alternative is wrapping the nav in `<Suspense>`
 * and letting it stream, which would flash an empty sidebar on every load.
 */
export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [about, project] = await Promise.all([getAboutData(), getProjects().then((p) => findBySlug(p, slug))]);
  if (!about || !project) return {};
  return buildMetadata(projectDetailSeo(project, about), about);
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = findBySlug(await getProjects(), slug);
  if (!project) notFound();

  return (
    <main className="px-4 py-6 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-white">{project.title}</h1>
        <p className="mt-2 text-zinc-400">Not migrated yet.</p>
      </div>
    </main>
  );
}
