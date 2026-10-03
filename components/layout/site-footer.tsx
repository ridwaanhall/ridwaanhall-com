"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ArrowFx, LineText, RollLabel } from "@/components/motion/interactive";
import { SplitHeading } from "@/components/motion/reveal";
import { ArrowLink, CONTAINER, FOCUS } from "@/components/site/ui";
import type { AboutData } from "@/lib/data/about";
import { isActive, normalizePath, visibleNavItems } from "@/lib/nav";
import { cn } from "@/lib/utils/cn";
import { useCurrentYear } from "@/lib/utils/use-current-year";

const LINK = cn("rounded-full text-zinc-400 transition-colors duration-300 hover:text-zinc-100", FOCUS);

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
 * set as traces.
 */
export function SiteFooter({ about }: { about: AboutData }) {
  const pathname = usePathname();
  const year = useCurrentYear();
  const social = about.social_media;
  const sponsor = about.donate[2]?.url ?? "";

  const elsewhere = [
    social.github && { href: social.github, label: "GitHub" },
    social.linkedin && { href: social.linkedin, label: "LinkedIn" },
    social.instagram && { href: social.instagram, label: "Instagram" },
    social.medium && { href: social.medium, label: "Medium" },
    social.x && { href: social.x, label: "X" },
    sponsor && { href: sponsor, label: "Support my work" },
  ].filter(Boolean) as { href: string; label: string }[];

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
                <a href={`mailto:${social.email}`} className={cn(LINK, "type-meta")}>
                  <LineText>{social.email}</LineText>
                </a>
              )}
            </div>
          </div>

          <FooterList title="Pages">
            {visibleNavItems().map((item) => (
              <li key={item.href}>
                {isActive(item, pathname) && !item.matchNested ? (
                  <span aria-current="page" className="text-zinc-100">
                    {item.label}
                  </span>
                ) : (
                  <Link href={item.href} className={LINK}>
                    <RollLabel press={false}>{item.label}</RollLabel>
                  </Link>
                )}
              </li>
            ))}
          </FooterList>

          {elsewhere.length > 0 && (
            <FooterList title="Elsewhere">
              {elsewhere.map((link) => (
                <li key={link.href}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className={cn(LINK, "inline-flex items-center gap-1")}>
                    <RollLabel press={false}>{link.label}</RollLabel>
                    <ArrowFx direction="up-right" className="h-3 w-3 opacity-60" />
                  </a>
                </li>
              ))}
            </FooterList>
          )}

          <FooterList title="More">
            {more.map((link) => (
              <li key={link.href}>
                {here === link.href ? (
                  <span aria-current="page" className="text-zinc-100">
                    {link.label}
                  </span>
                ) : (
                  <Link href={link.href} className={LINK}>
                    <RollLabel press={false}>{link.label}</RollLabel>
                  </Link>
                )}
              </li>
            ))}
          </FooterList>
        </div>

        <div className="type-meta mt-20 flex flex-col gap-4 text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
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
          <button
            type="button"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                  ? "auto"
                  : "smooth",
              })
            }
            className={cn(LINK, "inline-flex cursor-pointer items-center gap-1.5 self-start sm:self-auto")}
          >
            <RollLabel>Back to top</RollLabel>
            <ArrowFx direction="up" className="h-3 w-3" />
          </button>
        </div>
      </div>
    </footer>
  );
}

function FooterList({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="type-meta mb-5 text-zinc-500">{title}</h2>
      <ul className="space-y-3 text-sm">{children}</ul>
    </div>
  );
}
