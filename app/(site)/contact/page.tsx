import type { Metadata } from "next";

import { getAboutData } from "@/lib/data/about";
import { contactSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { contactSchemas } from "@/lib/seo/schemas-for-page";
import { JsonLdScript } from "@/components/seo/json-ld";
import { ContactForm } from "@/components/site/contact-form";
import { SocialLinks } from "@/components/site/social-links";
import { PAGE_GUTTER } from "@/lib/ui/shapes";
import { PageHeader } from "@/components/site/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutData();
  if (!about) return {};
  return buildMetadata(contactSeo(about), about);
}

export default async function ContactPage() {
  const about = await getAboutData();
  if (!about) return null;

  return (
    <>
      <JsonLdScript schemas={contactSchemas(about)} />
      <main className={PAGE_GUTTER}>
        <div>
          <PageHeader
            title="Contact Me"
            lead={
              <>Some conversations don&rsquo;t start with code, they begin with a message.</>
            }
          />

          <SocialLinks about={about} />
          <ContactForm />
        </div>
      </main>
    </>
  );
}
