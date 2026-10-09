import Link from "next/link";
import { Suspense } from "react";

import { CopyButton } from "@/components/foothill/controls";
import { FooterTwin, GiantWord, LlmsLink } from "@/components/foothill/footer-parts";
import { Icon, type IconName } from "@/components/foothill/icons";
import { Button, Facts } from "@/components/foothill/ui";
import type { AboutData } from "@/lib/data/about";
import { basedIn, socialLinks } from "@/lib/site/display";

// The year the build ran, not the year the page is read in: reading the clock
// inside a prerendered tree would make every page dynamic.
const YEAR = Number(process.env.NEXT_PUBLIC_BUILD_YEAR) || 2026;

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

const SITE_LINKS = [
  ["/openhire", "Open-hire"],
  ["/dashboard", "Dashboard"],
  ["/guestbook", "Guestbook"],
  ["/privacy-policy", "Privacy"],
  ["/terms", "Terms"],
] as const;

/** A footer link: the label rolls up to a copy of itself, the icon darkens. */
function Roll({ children }: { children: string }) {
  return (
    <span className="roll">
      <span>{children}</span>
    </span>
  );
}

/**
 * The foot of every page: an invitation to write, where else he is, how to
 * support the work, and the small print, with the username set huge and
 * cropped beneath it all.
 *
 * The invitation band steps aside on a page that is already the way to get in
 * touch (`main[data-quiet]`, in styles/site.css), so Contact does not end by
 * asking the reader to contact.
 */
export function Footer({
  about,
  availability,
  hiringStatus,
}: {
  about: AboutData;
  /** "Within 1 month", from the open-to-work profile. */
  availability: string | null;
  /** "Currently Hiring", from RoneAI's profile. */
  hiringStatus: string | null;
}) {
  const email = about.social_media.email;
  const socials = socialLinks(about);
  const where = about.location.residency || about.location.regency;

  return (
    <footer className="fh-footer">
      <section className="wrap cta-band">
        <div>
          <h2 className="t2" style={{ maxWidth: "14ch" }}>
            Have something in mind?
          </h2>
          <p className="lead" style={{ marginTop: 14, maxWidth: "46ch" }}>
            Work, a question about one of the APIs, or a note to say hello. {about.short_cta}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 26 }}>
            <Button href="/contact" icon="pen">
              Write to me
            </Button>
            {email && <CopyButton text={email} label={email} doneLabel="Address copied" message="Email address copied" />}
          </div>
        </div>
        <Facts
          rows={[
            ["Replies", "In 1 to 2 hours"],
            ["Hours", "Weekdays, GMT+7"],
            ...(about.is_open_to_work && availability ? [["Open to work", availability] as [string, string]] : []),
            ...(about.is_hiring && hiringStatus ? [["RoneAI", hiringStatus] as [string, string]] : []),
          ]}
        />
      </section>
      <div className="wrap">
        <div className="foot">
          <div>
            <Link className="brand" href="/" aria-label={`${about.username}, home`}>
              <Roll>{about.username}</Roll>
            </Link>
            <p className="meta" style={{ marginTop: 12, maxWidth: "30ch" }}>
              {about.role}, building from {basedIn(about) || where}.
            </p>
          </div>
          <div>
            <h4>Elsewhere</h4>
            <ul>
              {socials.map((social) => (
                <li key={social.label}>
                  <a href={social.href} target="_blank" rel="noopener noreferrer me">
                    <Icon name={SOCIAL_ICON[social.label] ?? "out"} />
                    <Roll>{social.label}</Roll>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Support the work</h4>
            <ul>
              {about.donate.map((option) => (
                <li key={option.platform}>
                  <a href={option.url} target="_blank" rel="noopener noreferrer">
                    <Icon name={DONATE_ICON[option.platform] ?? "gift"} />
                    <Roll>{option.platform}</Roll>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Site</h4>
            <ul>
              {SITE_LINKS.map(([href, label]) => (
                <li key={href}>
                  <Link href={href}>
                    <Roll>{label}</Roll>
                  </Link>
                </li>
              ))}
              <li>
                <LlmsLink />
              </li>
            </ul>
          </div>
        </div>
        <div className="base">
          <span>
            © {YEAR} {about.name}. Built in {where}, Indonesia.
          </span>
          {/* It reads the pathname, which suspends while a route whose params
              were not listed in advance is prerendered. */}
          <Suspense fallback={null}>
            <FooterTwin />
          </Suspense>
          {about.aka && <span>Also known as {about.aka}</span>}
        </div>
      </div>
      <div className="giant" aria-hidden="true">
        <GiantWord word={about.username} />
      </div>
    </footer>
  );
}
