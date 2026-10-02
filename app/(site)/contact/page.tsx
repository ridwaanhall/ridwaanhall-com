import type { Metadata } from "next";

import { getAboutData } from "@/lib/data/about";
import { contactSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { contactSchemas } from "@/lib/seo/schemas-for-page";
import { JsonLdScript } from "@/components/seo/json-ld";
import { ContactForm } from "@/components/site/contact-form";
import { SocialLinks } from "@/components/site/social-links";
import { CONTAINER, PageHeader } from "@/components/site/ui";

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
      <main className={CONTAINER}>
        <PageHeader
          title="Contact"
          lead={<>Some conversations don&rsquo;t start with code, they begin with a message.</>}
        />

        <div className="grid gap-16 border-t border-zinc-800 pt-12 pb-8 md:pt-16 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          <SocialLinks about={about} />
          <ContactForm />
        </div>
      </main>
    </>
  );
}
