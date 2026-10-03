import Link from "next/link";

import { EYEBROW } from "@/components/foothill/classes";
import { WRAP } from "@/components/foothill/layout";
import { Mark } from "@/components/foothill/mark";
import type { AboutData } from "@/lib/data/about";
import { socialLinks } from "@/lib/site/display";

// The year the build ran, not the year the page is read in: reading the clock
// inside a prerendered tree would make every page dynamic.
const YEAR = Number(process.env.NEXT_PUBLIC_BUILD_YEAR) || 2026;

/**
 * The foot of every page: how to reach him, where else he is, and the small
 * print.
 *
 * The address leads because the footer is where a reader who has made it to
 * the bottom of a page decides whether to get in touch.
 */
export function Footer({ about }: { about: AboutData }) {
  const email = about.social_media.email;
  const socials = socialLinks(about);

  return (
    <footer className="mt-auto border-t border-line">
      <div className={`${WRAP} pt-16 pb-10 md:pt-24`}>
        <div className="grid gap-14 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className={EYEBROW}>Say hello</p>
            {email && (
              <a
                href={`mailto:${email}`}
                className="group mt-4 inline-flex items-baseline gap-3 text-[clamp(1.75rem,1.2rem+2.4vw,3rem)] font-medium tracking-[-0.03em] text-ink"
              >
                <span className="fh-link">{email}</span>
                <span
                  aria-hidden="true"
                  className="text-mute transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-sulfur"
                >
                  ↗
                </span>
              </a>
            )}
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-mute">
              Work, a question about one of the APIs, or just a note.{" "}
              <Link href="/contact" className="fh-link text-ink">
                Or use the form
              </Link>
              .
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 md:col-span-5">
            <div>
              <p className={EYEBROW}>Elsewhere</p>
              <ul className="mt-4 space-y-2.5 text-[15px]">
                {socials.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer me"
                      className="text-mute transition-colors hover:text-ink"
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className={EYEBROW}>Support</p>
              <ul className="mt-4 space-y-2.5 text-[15px]">
                {about.donate.map((option) => (
                  <li key={option.platform}>
                    <a
                      href={option.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-mute transition-colors hover:text-ink"
                    >
                      {option.platform}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-line pt-6 text-[13px] text-mute md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Mark className="h-3 w-5 text-ink" />
            <span>
              © {YEAR} {about.name}. Made in {about.location.residency || about.location.regency},
              between two volcanoes.
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/privacy-policy" className="transition-colors hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-ink">
              Terms
            </Link>
            <span className="fh-mono text-[11px] tracking-[0.08em]">7.53°S 110.60°E</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
