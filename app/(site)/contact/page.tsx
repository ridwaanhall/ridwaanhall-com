import type { Metadata } from "next";

import { ContactForm } from "@/components/foothill/contact-form";
import { Brand, Icon } from "@/components/foothill/icons";
import { MAIN, WRAP } from "@/components/foothill/layout";
import { PageMotion, Reveal, Roll } from "@/components/foothill/motion";
import { PageHead } from "@/components/foothill/ui";
import { JsonLdScript } from "@/components/seo/json-ld";
import { getAboutData } from "@/lib/data/about";
import { contactSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { contactSchemas } from "@/lib/seo/schemas-for-page";
import { bareUrl, socialLinks } from "@/lib/site/display";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutData();
  if (!about) return {};
  return buildMetadata(contactSeo(about), about);
}

export default async function ContactPage() {
  const about = await getAboutData();
  if (!about) return null;
  const email = about.social_media.email;

  return (
    <main className={MAIN}>
      <JsonLdScript schemas={contactSchemas(about)} />
      <div className={WRAP}>
        <PageHead
          title="Write to me."
          lead={
            about.is_sick
              ? "I'm recovering at the moment, so replies may be slower than usual, but every message is read."
              : "Work, a question about one of the APIs, or just a note. Every message is read."
          }
        />

        <div className="mt-16 grid gap-16 md:mt-24 lg:grid-cols-12 lg:gap-10">
          <Reveal className="lg:col-span-7">
            <ContactForm />
          </Reveal>
          <aside className="lg:col-span-4 lg:col-start-9">
            {email && (
              <Reveal>
                <p className="text-[14px] font-medium text-ink">Or email directly</p>
                <a
                  href={`mailto:${email}`}
                  className="group mt-3 inline-flex items-center gap-2 font-display text-[24px] font-medium tracking-[-0.02em] text-ink"
                >
                  <Roll>{email}</Roll>
                  <Icon
                    name="arrow-up-right"
                    className="h-5 w-5 text-mute transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-sulfur"
                  />
                </a>
              </Reveal>
            )}
            <div className="mt-12">
              <p className="text-[14px] font-medium text-ink">Elsewhere</p>
              <Reveal as="ul" stagger className="mt-3">
                {socialLinks(about).map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer me"
                      className="group flex items-center gap-4 border-b border-line py-3.5 text-[16px]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-raise text-ink transition-colors duration-300 group-hover:bg-ink group-hover:text-paper">
                        <Brand name={social.label} className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-ink">{social.label}</span>
                        <span className="block truncate text-[13px] text-mute">{bareUrl(social.href)}</span>
                      </span>
                      <Icon
                        name="arrow-up-right"
                        className="text-mute transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink"
                      />
                    </a>
                  </li>
                ))}
              </Reveal>
            </div>
          </aside>
        </div>
      </div>
      <PageMotion />
    </main>
  );
}
