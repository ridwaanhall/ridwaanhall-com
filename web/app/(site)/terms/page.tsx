import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAboutData } from "@/lib/data/about";
import { getLegalDocument } from "@/lib/data/legal";
import { legalDocumentSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";

/**
 * Terms keeps its own `/terms/` path rather than living under `/legal/`.
 *
 * That URL is in the sitemap, the footer of every page and the search modal,
 * and all of those predate the legal-document model. Django expressed this as
 * a second URLconf entry pointing the same view at a fixed slug.
 */
const SLUG = "terms-and-conditions";

export async function generateMetadata(): Promise<Metadata> {
  const [about, document] = await Promise.all([getAboutData(), getLegalDocument(SLUG)]);
  if (!about || !document) return {};
  return buildMetadata(legalDocumentSeo(about, document), about);
}

export default async function TermsPage() {
  const document = await getLegalDocument(SLUG);
  if (!document) notFound();

  return (
    <main className="px-4 py-6 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-white">{document.title}</h1>
        <p className="mt-2 text-zinc-400">Not migrated yet.</p>
      </div>
    </main>
  );
}
