import { SkeletonBar, SkeletonBlock } from "@/components/skeleton";
import { cn } from "@/lib/utils/cn";

/**
 * One dashboard panel, holding its height while its API answers.
 *
 * Its own module because `loading.tsx` needs it as well as the page does, and a
 * `loading.tsx` importing from a sibling `page.tsx` would drag the page's data
 * imports into the fallback for no reason.
 *
 * **Named after the panel rather than parameterised by shape.** It used to take
 * a column count and draw four cards either way, which was wrong for both:
 * WakaTime renders six cards, two gradient panels, and an AI block of four more
 * cards over a third panel; GitHub renders four and a contribution heatmap.
 * Held at four bare cards, the panel came in at less than half the height it
 * was standing in for, and the page jumped by the difference -- twice, since
 * the two panels stream independently. These are the skeletons a reader
 * actually watches, because they are waiting on a third party rather than on a
 * payload.
 *
 * The column counts are written out rather than interpolated: Tailwind
 * generates a class only if it can see it in the source, so
 * `lg:grid-cols-${columns}` would produce no rule at all.
 */
export function DashboardPanelSkeleton({
  panel,
}: {
  panel: "today" | "wakatime" | "year" | "rhythm" | "github";
}) {
  return (
    <div className="skeleton-pulse py-14 md:py-20" role="status" aria-busy="true">
      <span className="sr-only">Loading statistics…</span>
      <div aria-hidden="true">
        {/* The panel's marker, then its heading. */}
        <PanelHeading />

        {panel === "today" ? (
          <>
            {/*
              Four cards four across, then the ribbon panel: a track, its hour
              axis, and the language legend. One height at every width: the
              ribbon is the same depth throughout and the legend wraps within
              its own row rather than adding one.
            */}
            <StatGrid count={4} columns={4} />
            <SkeletonBlock className="mt-12 h-[120px]" />
          </>
        ) : panel === "rhythm" ? (
          <>
            {/*
              Four cards, the weekday chart, the trend chart, and the comparison
              strip. Three separate blocks because the two charts are separate
              panels with a gap between them, and one tall block would hold the
              wrong shape at every width rather than only at the narrow ones.

              Two of the four cards and the whole trend panel are drawn on a
              request whose insight calls failed and do not arrive. That is the
              rarer state, and holding the taller of the two is the direction
              that fails safely: the page settles upward into the gap rather
              than shoving the calendar below it down past a reader's finger.
            */}
            <StatGrid count={4} columns={4} />
            <SkeletonBlock className="mt-12 h-[244px] sm:h-[268px]" />
            <SkeletonBlock className="mt-12 h-[140px] sm:h-[180px]" />
            <SkeletonBlock className="mt-12 h-[100px] sm:h-[96px]" />
          </>
        ) : panel === "year" ? (
          <>
            {/*
              Eight cards four across, then the AI/human split bar, then the
              heatmap and three breakdown panels. The panels are three separate
              blocks rather than one wide one because below `lg` they stack, and
              a single block would understate the section by two panel heights
              on exactly the screens where the jump is worst.
            */}
            <StatGrid count={8} columns={4} />
            <SkeletonBlock className="mt-12 h-[65px]" />
            <SkeletonBlock className="mt-12 h-[168px]" />
            <div className="mt-12 grid gap-10 lg:grid-cols-3 lg:gap-8">
              <SkeletonBlock className="h-[136px]" />
              <SkeletonBlock className="h-[136px]" />
              <SkeletonBlock className="h-[136px]" />
            </div>
          </>
        ) : panel === "wakatime" ? (
          <>
            {/* Six stat cards, two across. */}
            <StatGrid count={6} columns={2} />

            {/* Languages, Categories and Editors: three across from `lg`. */}
            <div className="mt-12 grid gap-10 lg:grid-cols-3 lg:gap-8">
              <SkeletonBlock className="h-[136px]" />
              <SkeletonBlock className="h-[136px]" />
              <SkeletonBlock className="h-[136px]" />
            </div>

            {/*
              The AI block: its own heading, eight cards four across, the
              AI/human split bar, and its own pair of panels. Roughly half the
              WakaTime panel's height, so leaving it out here is the drift this
              file exists to prevent -- and the panels have to be a pair rather
              than one wide block, because below `md` they stack and the section
              grows by a whole panel.

              Four of the eight cards are drawn on a week whose heuristics call
              failed and only four arrive. That is the rarer state, and holding
              the taller of the two is the direction that fails safely: the page
              settles upward into the gap rather than shoving the GitHub panel
              down past a reader's finger.
            */}
            <div className="pt-14 md:pt-20">
              <PanelHeading />
            </div>
            <StatGrid count={8} columns={4} />
            <SkeletonBlock className="mt-12 h-[65px]" />
            <div className="mt-12 flex flex-col gap-10 md:flex-row md:gap-8">
              <SkeletonBlock className="h-[136px] flex-1" />
              <SkeletonBlock className="h-[136px] flex-1" />
            </div>
          </>
        ) : (
          <>
            <StatGrid count={4} columns={4} />

            {/*
              The contribution heatmap: seven rows of cells over a month strip,
              with a legend beneath. It scrolls sideways on a narrow screen, so
              the height is what matters and it is the same at every width.
            */}
            <SkeletonBlock className="mt-12 h-[168px]" />
          </>
        )}
      </div>
    </div>
  );
}

/** `Section`'s heading as the dashboard draws it: a mono marker, then the title. */
function PanelHeading() {
  return (
    <div className="mb-10 md:mb-12">
      <SkeletonBar className="mb-3 h-3 w-24 bg-zinc-900/60" />
      <SkeletonBar className="h-6 w-56 bg-zinc-900/60 md:h-7" />
    </div>
  );
}

/** The page's figures: a mono label and a large number, in a grid, unruled. */
function StatGrid({ count, columns }: { count: number; columns: 2 | 4 }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-8 gap-y-10", columns === 4 ? "lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2")}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <SkeletonBar className="h-3 w-24" />
          <SkeletonBar className="mt-3 h-6 w-24 sm:h-7" />
        </div>
      ))}
    </div>
  );
}
