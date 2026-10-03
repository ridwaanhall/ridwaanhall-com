import { Reveal } from "@/components/motion/reveal";
import { ButtonLink } from "@/components/site/ui";

/**
 * The invitation to sponsor, as one quiet line rather than a pink banner.
 *
 * Same words and the same link as before; the gradient, the decorative discs
 * and the pulsing heart are gone. A request for support reads as more
 * sincere when it is not the loudest thing on the page -- so no rule or box
 * sets it apart either, only the space above it.
 */
export function SponsorMe({ sponsorUrl }: { sponsorUrl: string }) {
  if (!sponsorUrl) return null;

  return (
    <Reveal className="flex flex-col gap-6 py-14 sm:flex-row sm:items-center sm:justify-between md:py-20">
      <div className="max-w-xl">
        <h2 className="type-section text-zinc-100">Support my work</h2>
        <p className="mt-3 type-lead text-zinc-400">
          Help me continue creating open source projects and sharing knowledge with the community!
        </p>
      </div>
      <ButtonLink href={sponsorUrl} variant="secondary" arrow="up-right" className="self-start sm:self-auto">
        Support
      </ButtonLink>
    </Reveal>
  );
}
