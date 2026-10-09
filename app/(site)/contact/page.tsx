import type { Metadata } from "next";

import { ContactForm } from "@/components/foothill/contact-form";
import { CopyButton } from "@/components/foothill/controls";
import { Icon, type IconName } from "@/components/foothill/icons";
import { MAIN } from "@/components/foothill/layout";
import { PageMotion } from "@/components/foothill/motion";
import { PageHead } from "@/components/foothill/ui";
import { JsonLdScript } from "@/components/seo/json-ld";
import { getAboutData } from "@/lib/data/about";
import { contactSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { contactSchemas } from "@/lib/seo/schemas-for-page";
import { bareUrl, basedIn, socialLinks } from "@/lib/site/display";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutData();
  if (!about) return {};
  return buildMetadata(contactSeo(about), about);
}

const SOCIAL_ICON: Record<string, IconName> = {
  GitHub: "github",
  LinkedIn: "linkedin",
  X: "xlogo",
  Instagram: "instagram",
  Medium: "medium",
  RoneAI: "globe",
};

const DONATE_ICON: Record<string, IconName> = {
  "GitHub Sponsors": "heart",
  "Buy Me a Coffee": "coffee",
  Sociabuzz: "gift",
  Saweria: "gift",
};

export default async function ContactPage() {
  const about = await getAboutData();
  if (!about) return null;
  const email = about.social_media.email;

  return (
    // Quiet: the footer's invitation to write steps aside on the page that is it.
    <main className={MAIN} data-quiet="">
      <JsonLdScript schemas={contactSchemas(about)} />
      <div>
        <PageHead
          title="Write to me."
          lead={
            about.is_sick
              ? "I'm recovering at the moment, so replies may be slower than usual, but every message is read."
              : "Work, a question about one of the APIs, or just a note. Every message is read."
          }
          markdown="/contact"
          facts={[
            ["Replies", about.is_sick ? "Slower than usual" : "In 1 to 2 hours"],
            ["Hours", "Weekdays, GMT+7"],
            ["Based in", basedIn(about)],
          ]}
        />
        <div className="wrap gbwrap contact" style={{ paddingBottom: 80 }}>
          <div className="contact-main">
            <ContactForm />
          </div>
          <div className="contact-side">
            {email && (
              <div>
                <span className="meta">Or email directly</span>
                <p className="t3" style={{ marginTop: 6 }}>
                  <a className="ul" href={`mailto:${email}`}>
                    {email}
                  </a>
                </p>
                <div style={{ marginTop: 10 }}>
                  <CopyButton sm text={email} label="Copy address" message="Email address copied" />
                </div>
              </div>
            )}
            <div>
              <span className="meta">Elsewhere</span>
              <div className="rows" style={{ marginTop: 8 }}>
                {socialLinks(about).map((social) => (
                  <a key={social.label} className="wrow social-row" href={social.href} target="_blank" rel="noopener noreferrer me">
                    <Icon name={SOCIAL_ICON[social.label] ?? "out"} size={18} />
                    <span>
                      <span style={{ fontWeight: 500 }}>{social.label}</span>
                      <span className="meta mono" style={{ display: "block" }}>
                        {bareUrl(social.href)}
                      </span>
                    </span>
                    <span className="mono mute visit" style={{ fontSize: 12 }}>
                      Visit
                    </span>
                  </a>
                ))}
              </div>
            </div>
            {about.donate.length > 0 && (
              <div>
                <span className="meta">Support the work</span>
                <div className="sk-list" style={{ marginTop: 10 }}>
                  {about.donate.map((option) => (
                    <a key={option.platform} className="sk" href={option.url} target="_blank" rel="noopener noreferrer">
                      <Icon name={DONATE_ICON[option.platform] ?? "gift"} />
                      {option.platform}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <PageMotion />
    </main>
  );
}
