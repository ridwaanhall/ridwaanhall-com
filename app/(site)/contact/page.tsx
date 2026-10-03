import type { Metadata } from "next";

import { EYEBROW } from "@/components/foothill/classes";
import { ContactForm } from "@/components/foothill/contact-form";
import { MAIN, WRAP } from "@/components/foothill/layout";
import { PageMotion } from "@/components/foothill/page-motion";
import { Arrow, PageHead } from "@/components/foothill/ui";
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
          eyebrow="Contact"
          title="Write to me."
          lead={
            about.is_sick
              ? "I'm recovering at the moment, so replies may be slower than usual, but every message is read."
              : "Work, a question about one of the APIs, or just a note. Every message is read."
          }
        />

        <div className="mt-16 grid gap-16 md:mt-24 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <ContactForm />
          </div>
          <aside className="lg:col-span-4 lg:col-start-9">
            {email && (
              <div>
                <p className={EYEBROW}>Or email directly</p>
                <a href={`mailto:${email}`} className="group mt-3 inline-block text-[22px] font-medium tracking-[-0.02em] text-ink">
                  <span className="fh-link">{email}</span> <Arrow diagonal className="text-mute" />
                </a>
              </div>
            )}
            <div className="mt-12">
              <p className={EYEBROW}>Elsewhere</p>
              <ul className="mt-3 border-t border-line">
                {socialLinks(about).map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer me"
                      className="group flex items-baseline justify-between gap-4 border-b border-line py-3 text-[15px]"
                    >
                      <span className="text-ink">{social.label}</span>
                      <span className="fh-mono truncate text-[11px] text-mute group-hover:text-ink">
                        {bareUrl(social.href)} ↗
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
      <PageMotion />
    </main>
  );
}
