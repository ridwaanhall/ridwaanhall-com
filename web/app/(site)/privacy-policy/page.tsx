import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld";
import { getAboutData } from "@/lib/data/about";
import { getLegalDocument } from "@/lib/data/legal";
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
  const [about, document] = await Promise.all([getAboutData(), getLegalDocument(SLUG)]);
  if (!about) return null;

  return (
    <>
      <JsonLdScript schemas={privacyPolicySchemas(about, document)} />
      <main className="px-4 py-6 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold text-white">Privacy Policy</h1>
          <p className="mt-2 text-zinc-400">Not migrated yet.</p>
        </div>
      </main>
    </>
  );
}
