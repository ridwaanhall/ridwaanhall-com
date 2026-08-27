import {
  EmailIcon,
  GitHubIcon,
  InstagramIcon,
  LinkedInIcon,
  SupportIcon,
} from "@/components/icons/link-icons";
import type { AboutData } from "@/lib/data/about";

/**
 * The five coloured social buttons on the contact page.
 *
 * Each carries its brand colour, so the class strings are written out per
 * button rather than composed -- Tailwind generates a class only if it can see
 * it in the source, and `bg-${brand}-500` would produce no rule at all.
 *
 * A button is omitted when its URL is empty, rather than rendering a link that
 * goes nowhere.
 */
export function SocialLinks({ about }: { about: AboutData }) {
  const { social_media: social } = about;
  const sponsor = about.donate[2]?.url ?? "";

  const links = [
    social.email && {
      href: `mailto:${social.email}`,
      label: "Email",
      icon: <EmailIcon />,
      className: "text-zinc-900 bg-green-600 hover:bg-green-700",
    },
    social.github && {
      href: social.github,
      label: "Github",
      icon: <GitHubIcon />,
      className: "bg-black hover:bg-zinc-800",
    },
    social.linkedin && {
      href: social.linkedin,
      label: "LinkedIn",
      icon: <LinkedInIcon />,
      className: "bg-blue-500 text-zinc-900 hover:bg-blue-600",
    },
    sponsor && {
      href: sponsor,
      label: "Support",
      icon: <SupportIcon />,
      className: "bg-pink-500 hover:bg-pink-600",
    },
    social.instagram && {
      href: social.instagram,
      label: "Instagram",
      icon: <InstagramIcon />,
      // The one button whose brand is a gradient, so its hover is three stops
      // deepened together rather than a single `hover:bg-*`. It needs one at
      // all because colour is now the only thing that answers a pointer here.
      className:
        "bg-gradient-to-bl from-purple-500 via-pink-500 to-yellow-500 hover:from-purple-600 hover:via-pink-600 hover:to-yellow-600",
    },
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode; className: string }[];

  return (
    <div className="mt-8">
      <h2 className="text-xl font-medium flex items-center">
        <svg
          className="w-6 h-6 mr-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
        Let&rsquo;s stay in touch
      </h2>
      <p className="text-zinc-400 text-sm mt-2 mb-4">
        Here&rsquo;s where ideas become conversations&mdash;feel free to reach out.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            // `mailto:` opens the mail client in place; the rest are other sites.
            {...(link.href.startsWith("mailto:")
              ? {}
              : { target: "_blank", rel: "noopener noreferrer" })}
            // Colour is the whole hover. `transition-colors`, not
            // `transition-all`, so the property list matches what actually
            // moves -- and the button no longer grows under the pointer, which
            // nudged the four beside it in a five-across row.
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-[15px] transition-colors duration-300 border border-zinc-700 ${link.className}`}
          >
            {link.icon}
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
