import type { Metadata } from "next";

import { getAboutData } from "@/lib/data/about";
import { getBlogs } from "@/lib/data/content";
import { blogListSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const [about, blogs] = await Promise.all([getAboutData(), getBlogs()]);
  if (!about) return {};
  // The list is passed so the keyword set picks up the posts' own tags, which
  // is what Django did with its filtered list.
  return buildMetadata(blogListSeo(about, blogs), about);
}

export default function BlogPage() {
  return (
    <main className="px-4 py-6 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-white">Blog</h1>
        <p className="mt-2 text-zinc-400">Not migrated yet.</p>
      </div>
    </main>
  );
}
