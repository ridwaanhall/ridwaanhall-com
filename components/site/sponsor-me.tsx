import { Reveal } from "@/components/motion/reveal";
import { ArrowUpRightIcon, BUTTON_SECONDARY } from "@/components/site/ui";

/**
 * The invitation to sponsor, as one quiet line rather than a pink banner.
 *
 * Same words and the same link as before; the gradient, the decorative discs
 * and the pulsing heart are gone. A request for support reads as more
 * sincere when it is not the loudest thing on the page.
 */
export function SponsorMe({ sponsorUrl }: { sponsorUrl: string }) {
  if (!sponsorUrl) return null;

  return (
    <Reveal className="flex flex-col gap-6 border-t border-zinc-800 py-12 sm:flex-row sm:items-center sm:justify-between md:py-16"
    >
      <div className="max-w-xl">
        <h2 className="text-xl font-medium tracking-tight text-zinc-100 sm:text-2xl">Support My Work</h2>
        <p className="mt-2 text-base leading-relaxed text-zinc-400">
          Help me continue creating open source projects and sharing knowledge with the community!
        </p>
      </div>
      <a href={sponsorUrl} target="_blank" rel="noopener noreferrer" className={`${BUTTON_SECONDARY} self-start sm:self-auto`}>
        Support
        <ArrowUpRightIcon className="h-4 w-4" />
      </a>
    </Reveal>
  );
}
