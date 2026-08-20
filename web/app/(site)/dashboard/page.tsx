import type { Metadata } from "next";

import { getAboutData } from "@/lib/data/about";
import { dashboardSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { dashboardSchemas } from "@/lib/seo/schemas-for-page";
import { JsonLdScript } from "@/components/seo/json-ld";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutData();
  if (!about) return {};
  return buildMetadata(dashboardSeo(about), about);
}

export default async function DashboardPage() {
  const about = await getAboutData();
  if (!about) return null;

  return (
    <>
      <JsonLdScript schemas={await dashboardSchemas(about)} />
      <main className="px-4 py-6 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="mt-2 text-zinc-400">Not migrated yet.</p>
      </div>
      </main>
    </>
  );
}
