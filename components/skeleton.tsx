import {
  BREAKDOWN_GRID,
  LISTING_GRID,
  PAGE_GUTTER,
  STAT_GRID_4,
  STAT_GRID_6,
  SURFACE,
} from "@/lib/ui/shapes";
import { cn } from "@/lib/utils/cn";

/**
 * The shared skeleton vocabulary.
 *
 * Top level of `components/` rather than under `site/` or `admin/` because both
 * use it. Before this there were five hand-rolled skeletons that agreed on
 * almost nothing: two pulsed and two did not, three hid themselves from
 * assistive technology and two announced their raw shape, and two unrelated
 * files each exported a `PanelSkeleton` with a different signature. All five
 * are built from these pieces now.
 *
 * The point of a skeleton is that nothing moves when the content lands, so
 * every one of these takes its height from the real thing it stands in for --
 * which is why they carry explicit sizes rather than growing to fit.
 */

/** A line of text: a heading, a label, a paragraph row. */
export function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn("rounded bg-zinc-900", className)} />;
}

/**
 * A card-shaped surface.
 *
 * It reads `SURFACE`, which is the same string the real surfaces read, so a
 * skeleton's box and the box it stands in for cannot come to differ. They did:
 * this was a hand-written copy of a class in `styles/components.css` that
 * nothing else used any more.
 *
 * Takes children so a panel whose innards are worth sketching -- a form, a
 * table -- can be built inside one rather than beside it.
 */
export function SkeletonBlock({
  children,
  className,
  style,
}: {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(SURFACE, className)}
      style={style}
    >
      {children}
    </div>
  );
}

/**
 * A paragraph.
 *
 * The last row is short, because the last row of real prose almost always is;
 * a stack of equal bars reads as a table.
 */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonBar
          key={i}
          className={cn("h-3.5", i === lines - 1 ? "w-2/5" : i % 3 === 1 ? "w-11/12" : "w-full")}
        />
      ))}
    </div>
  );
}

/**
 * Every grid ladder a skeleton stands in for, named for the thing it covers.
 *
 * **These are the page's own ladders, not copies of them.** The map used to
 * hold five hand-written strings under a comment conceding that each "is read
 * against the grid on the page it covers, and the two line up only when both
 * are written the same way" -- which is a description of a thing that drifts,
 * written by somebody who could see it coming. They are the same constants the
 * pages import now, so there is no second copy left to disagree.
 *
 * Whole strings rather than a class assembled from a count: Tailwind emits a
 * class only where it can see it written out, so an interpolated column count
 * produces no rule at all and the skeleton collapses to one column at every
 * width.
 */
const SKELETON_GRIDS = {
  listing: LISTING_GRID,
  stat4: STAT_GRID_4,
  stat6: STAT_GRID_6,
  breakdown: BREAKDOWN_GRID,
} as const;

type SkeletonLadder = keyof typeof SKELETON_GRIDS;

/**
 * The listing grid.
 *
 * **The ladder is named, not built from two counts.** It used to take `columns`
 * and `mobileColumns` as independent numbers, which claims every pairing of the
 * two while the map holds only the five the site actually uses -- so asking for
 * three across on a wide screen and two on a phone type checked and then
 * indexed the map with a key that is not in it.
 */
export function SkeletonGrid({
  count = 4,
  ladder = "listing",
  height,
  className,
}: {
  count?: number;
  /** Which of the page's grids this stands in for. */
  ladder?: SkeletonLadder;
  /** Pixel height of each cell -- the real card's, so the page does not jump. */
  height: number;
  className?: string;
}) {
  return (
    <div className={cn(SKELETON_GRIDS[ladder], className)}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonBlock key={i} style={{ height }} />
      ))}
    </div>
  );
}

/**
 * The page frame every `loading.tsx` sits in.
 *
 * Deliberately a `<div>` and never a `<main>`. Every real page renders exactly
 * one `<main>`, and styles/animations.css hangs the content-entrance fade on
 * that element -- so the transition fires when the page replaces this, and
 * not when this replaces nothing.
 *
 * **One gutter.** There were two, and which page got which followed no rule
 * anybody could state -- `/blog` took the roomier one and `/projects`, the
 * listing beside it with the same shape, took the tighter. They differ only
 * below `sm`. With one, a route cannot pick the wrong one, and the thing that
 * used to be checked is now impossible instead.
 *
 * The inner element is not decoration and must not be removed. Two harnesses
 * measure through it -- one compares this frame's content edges against the
 * navbar's and the footer's, the other compares a skeleton against the page it
 * covers -- and both address it as the frame's only child. It carries the
 * page's vertical rhythm, which is the job it has now that the width cap it
 * used to hold is set further up.
 */
export function SkeletonPage({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" className={cn("skeleton-pulse", PAGE_GUTTER)}>
      {/* The shapes below are furniture; this is the only thing worth hearing. */}
      <span className="sr-only">Loading…</span>
      <div className="space-y-section" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}

/**
 * A page heading and its lead paragraph.
 *
 * Sized to the page scale over the lead scale, which is the pairing every page
 * opens with. The lead is capped at the reading measure here for the same
 * reason the real one is: a sentence set across the full content column is one
 * the eye loses its place in.
 */
export function SkeletonPageHeading({ className }: { className?: string }) {
  return (
    <div className={cn("mb-header", className)}>
      <SkeletonBar className="h-9 w-64 mb-3" />
      <SkeletonBar className="h-4 w-full max-w-measure mb-2" />
      <SkeletonBar className="h-4 w-3/5 max-w-md" />
    </div>
  );
}
