import type { Metadata } from "next";

import { getAboutData } from "@/lib/data/about";
import { aboutSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { aboutSchemas } from "@/lib/seo/schemas-for-page";
import { JsonLdScript } from "@/components/seo/json-ld";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutData();
  if (!about) return {};
  return buildMetadata(aboutSeo(about), about);
}

export default async function AboutPage() {
  const about = await getAboutData();
  if (!about) return null;

  return (
    <>
      <JsonLdScript schemas={await aboutSchemas(about)} />
      <main className="px-4 py-6 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-white">About</h1>
        <p className="mt-2 text-zinc-400">Not migrated yet.</p>
      </div>
      </main>
    </>
  );
}
