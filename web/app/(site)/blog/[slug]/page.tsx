import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAboutData } from "@/lib/data/about";
import { findBySlug, getBlogs } from "@/lib/data/content";
import { blogDetailSeo } from "@/lib/seo/data";
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
  const posts = await getBlogs();
  return posts.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [about, post] = await Promise.all([getAboutData(), getBlogs().then((p) => findBySlug(p, slug))]);
  if (!about || !post) return {};
  return buildMetadata(blogDetailSeo(post, about), about);
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = findBySlug(await getBlogs(), slug);
  if (!post) notFound();

  return (
    <main className="px-4 py-6 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-white">{post.title}</h1>
        <p className="mt-2 text-zinc-400">Not migrated yet.</p>
      </div>
    </main>
  );
}
