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
 * A card-shaped surface, matching `.surface-card`'s border and fill.
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
      className={cn("rounded-xl border border-zinc-800 bg-zinc-900/40", className)}
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
 * Every grid ladder a skeleton stands in for, keyed `<mobile>-<large>`.
 *
 * A map of whole strings rather than a class assembled from the two counts:
 * Tailwind emits a class only where it can see it written out, so an
 * interpolated `lg:grid-cols-${columns}` produces no rule at all and the
 * skeleton collapses to one column at every width.
 *
 * The redundant steps are left in. `grid-cols-2` already holds at every width,
 * so `sm:grid-cols-2` after it is a no-op -- but each string is read against
 * the grid on the page it covers, and the two line up only when both are
 * written the same way.
 */
const SKELETON_GRIDS = {
  "1-2": "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4",
  "2-2": "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4",
  "1-4": "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4",
  "2-4": "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4",
} as const;

/**
 * The listing grid.
 */
export function SkeletonGrid({
  count = 4,
  columns = 2,
  mobileColumns = 1,
  height,
  className,
}: {
  count?: number;
  columns?: 2 | 4;
  /**
   * Cards across below `sm`. Two only where the real grid pairs them there --
   * it halves the row count, and a skeleton holding eight rows for a section
   * that renders four overshoots it by half the panel on the narrowest screen.
   */
  mobileColumns?: 1 | 2;
  /** Pixel height of each cell -- the real card's, so the page does not jump. */
  height: number;
  className?: string;
}) {
  const grid = SKELETON_GRIDS[`${mobileColumns}-${columns}`];

  return (
    <div className={cn(grid, className)}>
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
 * The two gutters are the two the site actually uses: listings and the home
 * page are roomier, articles and detail pages are tighter on small screens.
 */
export function SkeletonPage({
  children,
  gutter = "page",
}: {
  children: React.ReactNode;
  gutter?: "page" | "article";
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn(
        "skeleton-pulse",
        gutter === "page" ? "px-4 py-6 md:px-6 lg:px-8" : "px-3 py-4 sm:px-4 md:px-6 lg:px-8",
      )}
    >
      {/* The shapes below are furniture; this is the only thing worth hearing. */}
      <span className="sr-only">Loading…</span>
      <div className="max-w-7xl mx-auto" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}

/**
 * A page heading and its lead paragraph.
 *
 * Sized to `text-2xl lg:text-3xl` over `text-base sm:text-lg`, which is the
 * pairing every listing and section page opens with.
 */
export function SkeletonPageHeading({ className }: { className?: string }) {
  return (
    <div className={cn("mb-4 md:mb-6", className)}>
      <SkeletonBar className="h-8 w-56 mb-3" />
      <SkeletonBar className="h-4 w-full max-w-2xl mb-2" />
      <SkeletonBar className="h-4 w-3/5 max-w-lg" />
    </div>
  );
}
