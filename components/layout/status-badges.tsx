import Link from "next/link";

import type { AboutData } from "@/lib/data/about";

/**
 * The three availability flags, in one place.
 *
 * They appear on four screens -- the navbar, the mobile drawer, the home hero
 * and the about intro -- and until they were gathered here each of those spelled
 * out its own labels and its own colours. They had already drifted apart: the
 * hero said "Under the Weather", the drawer said "Unwell", the sidebar said
 * "Open to Work" and the about intro said "Currently Open to Work", all for one
 * boolean.
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
 * Availability badges for the navbar and the mobile drawer.
 *
 * **All three can be true at once**, and that is the case worth testing before
 * judging any change here. Three of them is about 190px, which is why the navbar
 * shows them only from `2xl`: below that the row is already spending everything
 * it has on seven links, a name and a search box, and a wrapped navbar is worse
 * than a fact stated a screen further down. The home hero, the about intro and
 * the OpenHire link in the footer all still carry it.
 *
 * **Everything abbreviates.** The sidebar spelled "Open to Work" out while it was
 * the only flag set, because it had a whole column's width and one line to fill.
 * A row has neither, and a chip that changes width when an unrelated flag is
 * flipped moves every control beside it -- so the short labels are the labels
 * now, in both placements.
 *
 * The two differ in axis and in nothing else: the drawer wraps them under the
 * name, the navbar keeps them on the line and refuses to wrap.
 */
export function StatusBadges({
  about,
  variant,
}: {
  about: Pick<AboutData, "is_open_to_work" | "is_hiring" | "is_sick">;
  variant: "navbar" | "drawer";
}) {
  const { is_open_to_work: open, is_hiring: hiring, is_sick: sick } = about;
  if (!open && !hiring && !sick) return null;

  const navbar = variant === "navbar";
  const size = "px-2 py-0.5 text-xs";

  return (
    <div
      className={
        navbar
          ? "hidden shrink-0 items-center gap-1 2xl:flex"
          : "flex flex-wrap gap-1 min-w-0 mt-1.5"
      }
    >
      {(open || hiring) && (
        <Link href="/openhire" className={navbar ? "inline-flex shrink-0 gap-1" : "flex gap-1"}>
          {open && <StatusChip flag="open" short className={size} />}
          {hiring && <StatusChip flag="hiring" short className={size} />}
        </Link>
      )}

      {sick && <StatusChip flag="sick" short className={size} />}
    </div>
  );
}
