import Link from "next/link";

import type { AboutData } from "@/lib/data/about";

/**
 * The three availability flags, in one place.
 *
 * They appear on four screens -- the desktop rail, the mobile drawer, the home
 * hero and the about intro -- and until now each of those spelled out its own
 * labels and its own colours. They had already drifted apart: the hero said
 * "Under the Weather", the drawer said "Unwell", the rail said "Open to Work"
 * and the about intro said "Currently Open to Work", all for one boolean.
 *
 * `short` is what a narrow column gets. It is not a nicety: three badges beside
 * a 148px heading is 258px of content, which at 375px used to start the third
 * one past the right edge of the viewport.
 *
 * Classes are written out in full rather than composed from the hue. Tailwind
 * only emits a class it can see in the source, so a template string would
 * produce no rule at all -- the same reason recorded at the top of
 * `components/site/application-card.tsx`.
 */
export const AVAILABILITY = {
  open: {
    label: "Open to Work",
    short: "Open",
    hover: "hover:border-green-700/60 hover:text-green-400",
  },
  hiring: {
    label: "Hiring",
    short: "Hiring",
    hover: "hover:border-blue-700/60 hover:text-blue-400",
  },
  sick: {
    label: "Under the Weather",
    short: "Unwell",
    hover: "hover:border-amber-700/60 hover:text-amber-400",
    title: "Currently unwell — replies may be slow",
  },
} as const;

export type AvailabilityKey = keyof typeof AVAILABILITY;

/**
 * A flag, at rest.
 *
 * **No fill, no dot, no colour until the pointer arrives.** These three read on
 * almost every screen of the site, and as tinted pills with pulsing dots they
 * asked for attention on all of them -- three separate animations competing with
 * the content beside them. The colour still means what it meant; it now waits
 * to be asked for. A project's lifecycle and an application's outcome keep their
 * colour outright, because there the colour *is* the information.
 */
export const CHIP_REST =
  "pill-badge border border-zinc-700 text-zinc-400 transition-colors";

export function StatusChip({
  flag,
  short = false,
  className = "",
}: {
  flag: AvailabilityKey;
  /** Use the one-word label. Set where the column is too narrow to spell it out. */
  short?: boolean;
  className?: string;
}) {
  const badge = AVAILABILITY[flag];
  return (
    <span
      className={`${CHIP_REST} ${badge.hover} ${className}`}
      title={"title" in badge ? badge.title : undefined}
    >
      {short ? badge.short : badge.label}
    </span>
  );
}

/**
 * Availability badges for the sidebar rail and the mobile drawer.
 *
 * **All three can be true at once**, and that is the case worth testing before
 * judging any change here. In the 248px rail three badges beside `@username`
 * wrapped onto two lines and collided with it; in the mobile drawer they
 * additionally forced the name to wrap. Both placements therefore give the
 * badges their own row -- see the callers.
 *
 * The rail used to fuse Open and Hiring into a single gradient pill, because two
 * tinted pills with dots did not fit its 248px. Without the fill and the dots
 * they do, so that special case is gone and both variants now differ only in
 * padding -- and in the rail spelling out "Open to Work" where the drawer, which
 * has width to spare but little height, abbreviates.
 */
export function StatusBadges({
  about,
  variant,
}: {
  about: Pick<AboutData, "is_open_to_work" | "is_hiring" | "is_sick">;
  variant: "rail" | "drawer";
}) {
  const { is_open_to_work: open, is_hiring: hiring, is_sick: sick } = about;
  if (!open && !hiring && !sick) return null;

  const rail = variant === "rail";
  const size = `${rail ? "px-2 py-1" : "px-2 py-0.5"} text-xs`;
  // The rail has room for "Open to Work" only while it is the sole flag; with
  // Hiring beside it the pair has to be two words wide, not four.
  const abbreviate = !rail || (open && hiring);

  return (
    <div
      className={
        rail
          ? "flex flex-wrap items-center gap-1 w-full mt-2"
          : "flex flex-wrap gap-1 min-w-0 mt-1.5"
      }
    >
      {(open || hiring) && (
        <Link href="/openhire" className={rail ? "inline-flex gap-1" : "flex gap-1"}>
          {open && <StatusChip flag="open" short={abbreviate} className={size} />}
          {hiring && <StatusChip flag="hiring" short className={size} />}
        </Link>
      )}

      {sick && <StatusChip flag="sick" short className={size} />}
    </div>
  );
}
