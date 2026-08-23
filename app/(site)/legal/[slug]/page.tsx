import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAboutData } from "@/lib/data/about";
import { getLegalDocument, getLegalDocuments } from "@/lib/data/legal";
import { legalDocumentSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { legalDocumentSchemas } from "@/lib/seo/schemas-for-page";
import { JsonLdScript } from "@/components/seo/json-ld";
import { LegalDocumentPage } from "@/components/site/legal-document";

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

export default async function LegalSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [about, document, siblings] = await Promise.all([
    getAboutData(),
    getLegalDocument(slug),
    getLegalDocuments(),
  ]);
  if (!document || !about) notFound();

  return (
    <>
      <JsonLdScript schemas={legalDocumentSchemas(about, document)} />
      <LegalDocumentPage document={document} siblings={siblings} />
    </>
  );
}
