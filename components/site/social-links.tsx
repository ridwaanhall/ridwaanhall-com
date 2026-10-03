import {
  EmailIcon,
  GitHubIcon,
  InstagramIcon,
  LinkedInIcon,
  SupportIcon,
} from "@/components/icons/link-icons";
import { ArrowFx, HoverDim, IconFx } from "@/components/motion/interactive";
import { Reveal, SplitHeading } from "@/components/motion/reveal";
import type { AboutData } from "@/lib/data/about";

/**
 * Every way to reach the owner, as a ruled list.
 *
 * The same five channels, in the same order, as the brand-coloured buttons
 * this replaced -- green email, blue LinkedIn, pink support, an Instagram
 * gradient. Five brand colours in a row was the loudest thing on the page;
 * each channel now says what it is and where it goes, and the mark beside it
 * is drawn in the text colour.
 */
export function SocialLinks({ about }: { about: AboutData }) {
  const { social_media: social } = about;
  const sponsor = about.donate[2]?.url ?? "";

  const links = [
    social.email && { href: `mailto:${social.email}`, label: "Email", detail: social.email, icon: <EmailIcon /> },
    social.github && { href: social.github, label: "Github", detail: hostPath(social.github), icon: <GitHubIcon /> },
    social.linkedin && { href: social.linkedin, label: "LinkedIn", detail: hostPath(social.linkedin), icon: <LinkedInIcon /> },
    sponsor && { href: sponsor, label: "Support", detail: hostPath(sponsor), icon: <SupportIcon /> },
    social.instagram && { href: social.instagram, label: "Instagram", detail: hostPath(social.instagram), icon: <InstagramIcon /> },
  ].filter(Boolean) as { href: string; label: string; detail: string; icon: React.ReactNode }[];

  return (
    <div>
      <SplitHeading as="h2" className="type-section text-zinc-100">
        Let&rsquo;s stay in touch
      </SplitHeading>
      <p className="mt-3 text-[0.9375rem] text-pretty text-zinc-500">
        Here&rsquo;s where ideas become conversations&mdash;feel free to reach out.
      </p>
      {/* Choosing where to write: the other rows step back from the one
          pointed at, and its mark lifts. */}
      <HoverDim as="ul" className="mt-8">
        {links.map((link) => (
          <Reveal as="li" key={link.label}>
            <a
              data-dim-item=""
              href={link.href}
              // `mailto:` opens the mail client in place; the rest are other sites.
              {...(link.href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
              className="flex items-center gap-4 rounded-full py-3.5 text-zinc-400 transition-colors duration-500 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
            >
              <IconFx className="h-5 w-5 shrink-0 items-center justify-center [&_svg]:h-5 [&_svg]:w-5">
                {link.icon}
              </IconFx>
              <span className="type-item text-zinc-100">{link.label}</span>
              <span className="type-meta ml-auto min-w-0 truncate text-zinc-500">{link.detail}</span>
              <ArrowFx direction="up-right" className="h-4 w-4" />
            </a>
          </Reveal>
        ))}
      </HoverDim>
    </div>
  );
}

/** "github.com/someone" from a full URL, for the muted detail column. */
function hostPath(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname.replace(/^www\./, "")}${parsed.pathname.replace(/\/$/, "")}`;
  } catch {
    return url;
  }
}
