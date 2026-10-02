import Link from "next/link";

import { Reveal, SplitHeading } from "@/components/motion/reveal";
import { AVAILABILITY } from "@/components/layout/status-badges";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, StatusDot } from "@/components/site/ui";
import type { AboutData } from "@/lib/data/about";

/**
 * The homepage hero.
 *
 * Type does the work: a status line, the greeting set large, the bio as a lead
 * and two or three buttons. The colour-coded pills it replaced (indigo About,
 * green Hireable, pink Support) are one primary and the rest outlined -- the
 * order and the conditions are unchanged: "Hireable" when open to work,
 * otherwise "Support" if there is a sponsor link.
 */
export function HomeIntro({ about, sponsorUrl }: { about: AboutData; sponsorUrl: string }) {
  const statuses = [
    about.is_open_to_work && AVAILABILITY.open.label,
    about.is_hiring && AVAILABILITY.hiring.label,
  ].filter(Boolean) as string[];

  const place = [about.location.residency, about.location.country].filter(Boolean).join(", ");

  return (
    <section className="pt-14 pb-16 md:pt-28 md:pb-24">
      <Reveal className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-400">
        {statuses.length > 0 && (
          <Link
            href="/openhire"
            className="inline-flex items-center gap-2 rounded-sm transition-colors hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          >
            <StatusDot />
            {statuses.join(" · ")}
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

      <SplitHeading className="mt-8 max-w-4xl text-5xl font-medium leading-[1.02] tracking-tight text-balance text-zinc-100 sm:text-6xl md:text-7xl">
        Hi, I&apos;m {about.first_name}.{" "}
        <span className="text-zinc-500">{about.role}.</span>
      </SplitHeading>

      <Reveal as="p" className="mt-8 max-w-2xl text-lg leading-relaxed text-pretty text-zinc-400 sm:text-xl">
        {about.short_description.length > 0
          ? about.short_bio
          : "Coding by day, memorizing Quran by heart—who else but me? I'm a passionate Python developer and DevOps engineer crafting digital solutions that matter."}
      </Reveal>

      <Reveal className="mt-10 flex flex-wrap gap-3">
        <Link href="/about" className={BUTTON_PRIMARY}>
          About me
        </Link>
        <Link href="/contact" className={BUTTON_SECONDARY}>
          Contact
        </Link>
        {about.is_open_to_work ? (
          <Link href="/openhire" className={BUTTON_SECONDARY}>
            Hireable
          </Link>
        ) : sponsorUrl ? (
          <a href={sponsorUrl} target="_blank" rel="noopener noreferrer" className={BUTTON_SECONDARY}>
            Support
          </a>
        ) : null}
      </Reveal>
    </section>
  );
}
