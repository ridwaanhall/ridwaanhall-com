import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAboutData } from "@/lib/data/about";
import { getLegalDocument, getLegalDocuments } from "@/lib/data/legal";
import { legalDocumentSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { legalDocumentSchemas } from "@/lib/seo/schemas-for-page";
import { JsonLdScript } from "@/components/seo/json-ld";

export async function generateStaticParams() {
  const documents = await getLegalDocuments();
  return documents.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [about, document] = await Promise.all([getAboutData(), getLegalDocument(slug)]);
  if (!about || !document) return {};
  return buildMetadata(legalDocumentSeo(about, document), about);
}

export default async function LegalDocumentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [about, document] = await Promise.all([getAboutData(), getLegalDocument(slug)]);
  if (!document || !about) notFound();

  return (
    <>
      <JsonLdScript schemas={legalDocumentSchemas(about, document)} />
      <main className="px-4 py-6 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold text-white">{document.title}</h1>
          <p className="mt-2 text-zinc-400">Not migrated yet.</p>
        </div>
      </main>
    </>
  );
}
