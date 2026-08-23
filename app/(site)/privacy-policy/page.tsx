import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLdScript } from "@/components/seo/json-ld";
import { LegalDocumentPage } from "@/components/site/legal-document";
import { getAboutData } from "@/lib/data/about";
import { getLegalDocument, getLegalDocuments } from "@/lib/data/legal";
import { privacyPolicySeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { privacyPolicySchemas } from "@/lib/seo/schemas-for-page";

/**
 * The privacy policy keeps its own `/privacy-policy/` path rather than living
 * under `/legal/`. It is referenced by the sitemap, the SEO config, the footer
 * of every page and the search modal, all of which predate the legal-document
 * model.
 */
const SLUG = "privacy-policy";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutData();
  if (!about) return {};
  return buildMetadata(privacyPolicySeo(about), about);
}

export default async function PrivacyPolicyPage() {
  const [about, document, siblings] = await Promise.all([
    getAboutData(),
    getLegalDocument(SLUG),
    getLegalDocuments(),
  ]);
  if (!about || !document) notFound();

  return (
    <>
      <JsonLdScript schemas={privacyPolicySchemas(about, document)} />
      <LegalDocumentPage document={document} siblings={siblings} />
    </>
  );
}
