import {
  EmailIcon,
  GitHubIcon,
  InstagramIcon,
  LinkedInIcon,
  SupportIcon,
} from "@/components/icons/link-icons";
import { Reveal } from "@/components/motion/reveal";
import { ArrowUpRightIcon } from "@/components/site/ui";
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
      <h2 className="text-xl font-medium tracking-tight text-zinc-100">Let&rsquo;s stay in touch</h2>
      <p className="mt-2 text-sm text-zinc-500">
        Here&rsquo;s where ideas become conversations&mdash;feel free to reach out.
      </p>
      <ul className="mt-8 border-b border-zinc-800">
        {links.map((link) => (
          <Reveal as="li" key={link.label} className="border-t border-zinc-800">
            <a
              href={link.href}
              // `mailto:` opens the mail client in place; the rest are other sites.
              {...(link.href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
              className="group flex items-center gap-4 rounded-sm py-4 text-zinc-400 transition-colors hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center [&_svg]:h-5 [&_svg]:w-5">
                {link.icon}
              </span>
              <span className="text-base text-zinc-100">{link.label}</span>
              <span className="ml-auto min-w-0 truncate text-sm text-zinc-500">{link.detail}</span>
              <ArrowUpRightIcon className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </Reveal>
        ))}
      </ul>
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
