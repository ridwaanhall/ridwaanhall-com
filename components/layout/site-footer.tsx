"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ArrowLink, CONTAINER } from "@/components/site/ui";
import type { AboutData } from "@/lib/data/about";
import { isActive, normalizePath, visibleNavItems } from "@/lib/nav";
import { cn } from "@/lib/utils/cn";
import { useCurrentYear } from "@/lib/utils/use-current-year";

const LINK =
  "rounded-sm text-zinc-400 transition-colors hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";

/**
 * The foot of every public page.
 *
 * It took over what the rail's base used to carry -- the legal links, OpenHire
 * while either flag is set, the copyright -- and adds the two things a reader
 * at the end of a page is most likely to want next: a way to get in touch, and
 * every other place the owner can be found. Text links throughout; the brand
 * colours the old social buttons wore are gone with the buttons.
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
    <footer className="mt-12 border-t border-zinc-800">
      <div className={cn(CONTAINER, "py-16 md:py-24")}>
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="col-span-2 max-w-sm md:col-span-1">
            <p className="text-2xl font-medium leading-snug tracking-tight text-zinc-100 sm:text-3xl">
              {about.short_cta || "Have something in mind? Let's talk."}
            </p>
            <div className="mt-6 flex flex-col items-start gap-3">
              <ArrowLink href="/contact">Get in touch</ArrowLink>
              {social.email && (
                <a href={`mailto:${social.email}`} className={cn(LINK, "text-sm")}>
                  {social.email}
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
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </FooterList>

          {elsewhere.length > 0 && (
            <FooterList title="Elsewhere">
              {elsewhere.map((link) => (
                <li key={link.href}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className={LINK}>
                    {link.label}
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
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </FooterList>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-zinc-800 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
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
            className={cn(LINK, "cursor-pointer self-start text-xs sm:self-auto")}
          >
            Back to top ↑
          </button>
        </div>
      </div>
    </footer>
  );
}

function FooterList({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 text-xs text-zinc-500">{title}</h2>
      <ul className="space-y-2.5 text-sm">{children}</ul>
    </div>
  );
}
