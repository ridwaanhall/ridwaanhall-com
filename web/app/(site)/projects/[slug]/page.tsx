import { getProjects } from "@/lib/data/content";

/**
 * Prerender every known slug.
 *
 * Not only a performance win: under Cache Components a dynamic segment is URL
 * data, so a layout that reads `usePathname()` -- which the sidebar does, to
 * mark the current nav item -- cannot be prerendered for an unknown param. With
 * the slugs enumerated here each page has a concrete path at build time and the
 * whole shell prerenders. The alternative is wrapping the nav in `<Suspense>`
 * and letting it stream, which would flash an empty sidebar on every load.
 */
export async function generateStaticParams() {
  const items = await getProjects();
  return items.map(({ slug }) => ({ slug }));
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <main className="px-4 py-6 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-white">ProjectDetail</h1>
        <p className="mt-2 text-zinc-400">Not migrated yet: {slug}</p>
      </div>
    </main>
  );
}
