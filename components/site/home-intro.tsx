import Link from "next/link";

import { RollLabel } from "@/components/motion/interactive";
import { Reveal, SplitHeading } from "@/components/motion/reveal";
import { AVAILABILITY } from "@/components/layout/status-badges";
import { ButtonLink, FOCUS, StatusDot } from "@/components/site/ui";
import type { AboutData } from "@/lib/data/about";
import { cn } from "@/lib/utils/cn";

/**
 * The homepage hero.
 *
 * Type does the work: a status line set as a trace, the greeting at the
 * largest size on the site with the role a size down beneath it, the bio in
 * the reading face, and two or three
 * buttons. The order and the conditions of the buttons are fixed: "Hireable"
 * when open to work, otherwise "Support" if there is a sponsor link.
 */
export function HomeIntro({ about, sponsorUrl }: { about: AboutData; sponsorUrl: string }) {
  const statuses = [
    about.is_open_to_work && AVAILABILITY.open.label,
    about.is_hiring && AVAILABILITY.hiring.label,
  ].filter(Boolean) as string[];

  const place = [about.location.residency, about.location.country].filter(Boolean).join(", ");

  return (
    <section className="pt-16 pb-16 md:pt-32 md:pb-24">
      <Reveal className="type-meta flex flex-wrap items-center gap-x-5 gap-y-2 text-zinc-400">
        {statuses.length > 0 && (
          <Link
            href="/openhire"
            className={cn("inline-flex items-center gap-2 rounded-full transition-colors duration-500 hover:text-zinc-100", FOCUS)}
          >
            <StatusDot />
            <RollLabel>{statuses.join(" · ")}</RollLabel>
          </Link>
        )}
        {about.is_sick && (
          <span title={AVAILABILITY.sick.title} className="text-zinc-500">
            {AVAILABILITY.sick.label}
          </span>
        )}
        {place && (
          <span className="text-zinc-500">
            {place} {about.location.flag}
          </span>
        )}
      </Reveal>

      <SplitHeading className="mt-8 max-w-5xl type-hero text-zinc-100">
        {/* One string per run of text: SplitText breaks lines at text-node
            boundaries, so "{name}." written as two nodes let the full stop
            wrap onto a line of its own on a phone. */}
        {`Hi, I'm ${about.first_name}.`}
        {/* The role is the second half of the same heading, a size down and
            on its own line: one statement, read name first. */}
        <span className="mt-4 block type-section text-zinc-500">{`${about.role}.`}</span>
      </SplitHeading>

      <Reveal as="p" className="mt-9 max-w-2xl type-lead text-zinc-400">
        {about.short_description.length > 0
          ? about.short_bio
          : "Coding by day, memorizing Quran by heart—who else but me? I'm a passionate Python developer and DevOps engineer crafting digital solutions that matter."}
      </Reveal>

      <Reveal className="mt-11 flex flex-wrap gap-3">
        <ButtonLink href="/about" arrow="right">
          About me
        </ButtonLink>
        <ButtonLink href="/contact" variant="secondary">
          Contact
        </ButtonLink>
        {about.is_open_to_work ? (
          <ButtonLink href="/openhire" variant="secondary">
            Hireable
          </ButtonLink>
        ) : sponsorUrl ? (
          <ButtonLink href={sponsorUrl} variant="secondary" arrow="up-right">
            Support
          </ButtonLink>
        ) : null}
      </Reveal>
    </section>
  );
}
