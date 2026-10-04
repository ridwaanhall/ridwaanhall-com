import Link from "next/link";

import { H2, META } from "@/components/foothill/classes";
import { Brand, Icon } from "@/components/foothill/icons";
import { WRAP } from "@/components/foothill/layout";
import { Mark } from "@/components/foothill/mark";
import { Reveal, Roll } from "@/components/foothill/motion";
import type { AboutData } from "@/lib/data/about";
import { socialLinks } from "@/lib/site/display";

// The year the build ran, not the year the page is read in: reading the clock
// inside a prerendered tree would make every page dynamic.
const YEAR = Number(process.env.NEXT_PUBLIC_BUILD_YEAR) || 2026;

/** A footer column's link: the network's mark, its name, and an arrow on hover. */
function OutLink({ href, label, mark, me = false }: { href: string; label: string; mark: string; me?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel={me ? "noopener noreferrer me" : "noopener noreferrer"}
      className="group flex items-center gap-3 py-1.5 text-[15px] text-mute transition-colors hover:text-ink"
    >
      <Brand name={mark} className="h-[18px] w-[18px] transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110" />
      <Roll>{label}</Roll>
      <Icon
        name="arrow-up-right"
        className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100"
      />
    </a>
  );
}

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
            <Reveal as="h2" lines className={H2}>
              Have something in mind?
            </Reveal>
            {email && (
              <Reveal delay={0.15}>
                <a
                  href={`mailto:${email}`}
                  className="group mt-6 inline-flex items-center gap-3 font-display text-[clamp(1.4rem,1rem+1.8vw,2.25rem)] font-medium tracking-[-0.025em] text-ink"
                >
                  <Brand name="email" className="h-[0.9em] w-[0.9em] text-mute transition-colors group-hover:text-ink" />
                  <Roll>{email}</Roll>
                  <Icon
                    name="arrow-up-right"
                    className="h-[0.8em] w-[0.8em] text-mute transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-ink"
                  />
                </a>
              </Reveal>
            )}
            <p className={`${META} mt-5 max-w-md text-[15px] leading-relaxed`}>
              Work, a question about one of the APIs, or a note to say hello. If you would rather not
              open your mail app,{" "}
              <Link href="/contact" className="fh-link text-ink">
                the contact form
              </Link>{" "}
              reaches the same inbox.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 md:col-span-5">
            <div>
              <p className="text-[14px] font-medium text-ink">Elsewhere</p>
              <Reveal as="ul" stagger className="mt-3">
                {socials.map((social) => (
                  <li key={social.label}>
                    <OutLink href={social.href} label={social.label} mark={social.label === "RoneAI" ? "website" : social.label} me />
                  </li>
                ))}
              </Reveal>
            </div>
            <div>
              <p className="text-[14px] font-medium text-ink">Support the work</p>
              <Reveal as="ul" stagger className="mt-3">
                {about.donate.map((option) => (
                  <li key={option.platform}>
                    <OutLink href={option.url} label={option.platform} mark={option.platform} />
                  </li>
                ))}
              </Reveal>
            </div>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-line pt-6 text-[14px] text-mute md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Mark className="h-3 w-5 text-ink" />
            <span>
              © {YEAR} {about.name}. Built in {about.location.residency || about.location.regency}, Indonesia.
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="-my-1.5 py-1.5 transition-colors hover:text-ink">
              <Roll>Privacy</Roll>
            </Link>
            <Link href="/terms" className="-my-1.5 py-1.5 transition-colors hover:text-ink">
              <Roll>Terms</Roll>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
