import type { Metadata } from "next";

import { getAboutData } from "@/lib/data/about";
import { homepageSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutData();
  if (!about) return {};
  return buildMetadata(homepageSeo(about), about);
}

export default function HomePage() {
  return (
    <main className="px-4 py-6 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-white">Home</h1>
        <p className="mt-2 text-zinc-400">Not migrated yet.</p>
      </div>
    </main>
  );
}
