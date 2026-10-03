"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { EmailIcon, GitHubIcon, InstagramIcon, LinkedInIcon, MediumIcon, SupportIcon, XIcon } from "@/components/icons/link-icons";
import { IconFx, NudgeText, ScrambleHover } from "@/components/motion/interactive";
import { SplitHeading } from "@/components/motion/reveal";
import { ArrowLink, CONTAINER, FOCUS } from "@/components/site/ui";
import type { AboutData } from "@/lib/data/about";
import { isActive, normalizePath, visibleNavItems } from "@/lib/nav";
import { cn } from "@/lib/utils/cn";
import { useCurrentYear } from "@/lib/utils/use-current-year";

const LINK = cn("rounded-full text-zinc-400 transition-colors duration-500 hover:text-zinc-100", FOCUS);

/**
 * The foot of every public page.
 *
 * It took over what the rail's base used to carry -- the legal links, OpenHire
 * while either flag is set, the copyright -- and adds the two things a reader
 * at the end of a page is most likely to want next: a way to get in touch, and
 * every other place the owner can be found. Text links throughout; the brand
 * colours the old social buttons wore are gone with the buttons.
 *
 * Nothing rules it off from the page above. It begins with the largest type
 * below a page title, which is separation enough, and its list headings are
 * set as traces. Each list moves the way its links work: the site's own pages
 * nudge like an index, the places elsewhere lift their mark, and the address
 * re-resolves like the other traces. "Back to top" is not here: it is the
 * floating ring in `back-to-top.tsx`, which is useful long before the footer.
 */
export function SiteFooter({ about }: { about: AboutData }) {
  const pathname = usePathname();
  const year = useCurrentYear();
  const social = about.social_media;
  const sponsor = about.donate[2]?.url ?? "";

  const elsewhere = [
    social.github && { href: social.github, label: "GitHub", icon: GitHubIcon },
    social.linkedin && { href: social.linkedin, label: "LinkedIn", icon: LinkedInIcon },
    social.instagram && { href: social.instagram, label: "Instagram", icon: InstagramIcon },
    social.medium && { href: social.medium, label: "Medium", icon: MediumIcon },
    social.x && { href: social.x, label: "X", icon: XIcon },
    sponsor && { href: sponsor, label: "Support my work", icon: SupportIcon },
  ].filter(Boolean) as { href: string; label: string; icon: typeof GitHubIcon }[];

  const more: { href: Route; label: string }[] = [
    ...((about.is_open_to_work || about.is_hiring)
      ? [{ href: "/openhire" as Route, label: "OpenHire" }]
      : []),
    { href: "/privacy-policy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
  ];

  const here = normalizePath(pathname);

  return (
    <footer className="mt-16">
      <div className={cn(CONTAINER, "pt-20 pb-12 md:pt-28")}>
        <div className="grid grid-cols-2 gap-x-8 gap-y-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="col-span-2 max-w-md md:col-span-1">
            <SplitHeading as="p" className="type-section text-zinc-100">
              {about.short_cta || "Have something in mind? Let's talk."}
            </SplitHeading>
            <div className="mt-7 flex flex-col items-start gap-3">
              <ArrowLink href="/contact" className="text-zinc-200">
                Get in touch
              </ArrowLink>
              {social.email && (
                <a href={`mailto:${social.email}`} className={cn(LINK, "type-meta inline-flex items-center gap-2")}>
                  <EmailIcon aria-hidden="true" className="h-3.5 w-3.5" />
                  <ScrambleHover>{social.email}</ScrambleHover>
                </a>
              )}
            </div>
          </div>

          <FooterList title="Pages">
            {visibleNavItems().map((item) => (
              <li key={item.href}>
                <FooterLink
                  href={item.href}
                  label={item.label}
                  active={isActive(item, pathname)}
                  here={here === item.href}
                />
              </li>
            ))}
          </FooterList>

          {elsewhere.length > 0 && (
            <FooterList title="Elsewhere">
              {elsewhere.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(LINK, "inline-flex items-center gap-2.5")}
                  >
                    <IconFx press={false} className="h-4 w-4 [&_svg]:h-4 [&_svg]:w-4">
                      <link.icon aria-hidden="true" />
                    </IconFx>
                    {link.label}
                  </a>
                </li>
              ))}
            </FooterList>
          )}

          <FooterList title="More">
            {more.map((link) => (
              <li key={link.href}>
                <FooterLink href={link.href} label={link.label} active={here === link.href} here={here === link.href} />
              </li>
            ))}
          </FooterList>
        </div>

        <div className="type-meta mt-20 text-zinc-500">
          {/* An en dash, and only when there is a range to draw: a site read in
              its first year should not claim two of them. */}
          <p>
            © {year > 2025 ? `2025–${year}` : "2025"} {about.name}
            {about.location.residency && (
              <>
                {" · "}
                {about.location.residency}, {about.location.country}
              </>
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}

/**
 * One entry in a footer list.
 *
 * Always a link, and marked current by colour whenever the reader is inside
 * that section -- including a post under Blog or a project under Projects.
 * It used to become a plain `<span>` on an exact match and was excluded
 * outright for any item that matches nested paths, so Projects and Blog could
 * never be marked at all, and the list showed a current page on two routes
 * and on no others. `aria-current="page"` stays exact: it means "this link is
 * the page you are on", which a post is not.
 */
function FooterLink({
  href,
  label,
  active,
  here,
}: {
  href: Route;
  label: string;
  active: boolean;
  here: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={here ? "page" : undefined}
      className={cn(LINK, "inline-flex items-center", active && "text-zinc-100")}
    >
      <NudgeText>{label}</NudgeText>
    </Link>
  );
}

function FooterList({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="type-meta mb-5 text-zinc-500">{title}</h2>
      <ul className="space-y-3 text-sm [&>li]:flex [&>li]:h-5 [&>li]:items-center">{children}</ul>
    </div>
  );
}
