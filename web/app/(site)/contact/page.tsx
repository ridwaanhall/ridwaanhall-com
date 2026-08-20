import type { Metadata } from "next";

import { getAboutData } from "@/lib/data/about";
import { contactSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { contactSchemas } from "@/lib/seo/schemas-for-page";
import { JsonLdScript } from "@/components/seo/json-ld";
import { ContactForm } from "@/components/site/contact-form";
import { SocialLinks } from "@/components/site/social-links";

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
      <main className="px-3 py-4 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
              <div>
                <h1 className="text-2xl lg:text-3xl font-medium mb-2 tracking-tight">
                  Contact <span className="text-indigo-400">Me</span>
                </h1>
                <p className="mt-1 sm:mt-2 text-base sm:text-lg leading-relaxed">
                  Some conversations don&rsquo;t start with code, they begin with a message.
                </p>
              </div>
            </div>
          </div>

          <SocialLinks about={about} />
          <ContactForm />
        </div>
      </main>
    </>
  );
}
