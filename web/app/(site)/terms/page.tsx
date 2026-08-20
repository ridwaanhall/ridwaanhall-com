import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAboutData } from "@/lib/data/about";
import { getLegalDocument, getLegalDocuments } from "@/lib/data/legal";
import { legalDocumentSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { legalDocumentSchemas } from "@/lib/seo/schemas-for-page";
import { JsonLdScript } from "@/components/seo/json-ld";
import { LegalDocumentPage } from "@/components/site/legal-document";

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
  const [about, document, siblings] = await Promise.all([
    getAboutData(),
    getLegalDocument(SLUG),
    getLegalDocuments(),
  ]);
  if (!about || !document) notFound();

  return (
    <>
      <JsonLdScript schemas={legalDocumentSchemas(about, document)} />
      <LegalDocumentPage document={document} siblings={siblings} />
    </>
  );
}
