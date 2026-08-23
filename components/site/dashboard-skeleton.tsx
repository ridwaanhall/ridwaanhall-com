import { SkeletonBar, SkeletonBlock, SkeletonGrid } from "@/components/skeleton";

/**
 * One dashboard panel, holding its height while its API answers.
 *
 * Its own module because `loading.tsx` needs it as well as the page does, and a
 * `loading.tsx` importing from a sibling `page.tsx` would drag the page's data
 * imports into the fallback for no reason.
 *
 * **Named after the panel rather than parameterised by shape.** It used to take
 * a column count and draw four cards either way, which was wrong for both:
 * WakaTime renders six cards and two gradient panels under them, GitHub renders
 * four and a contribution heatmap. Held at four bare cards, the panel came in
 * at less than half the height it was standing in for, and the page jumped by
 * the difference -- twice, since the two panels stream independently. These are
 * the skeletons a reader actually watches, because they are waiting on a third
 * party rather than on a payload.
 *
 * The column counts are written out rather than interpolated: Tailwind
 * generates a class only if it can see it in the source, so
 * `lg:grid-cols-${columns}` would produce no rule at all.
 */
export function DashboardPanelSkeleton({ panel }: { panel: "wakatime" | "github" }) {
  return (
    <div className="skeleton-pulse mb-6" role="status" aria-busy="true">
      <span className="sr-only">Loading statistics…</span>
      <div aria-hidden="true">
        {/* The panel heading and the caption opposite it. */}
        <div className="flex flex-row items-center justify-between gap-2 mb-3 md:mb-4">
          <SkeletonBar className="h-7 w-56 bg-zinc-900/60" />
          <SkeletonBar className="h-4 w-24 bg-zinc-900/60" />
        </div>

        {panel === "wakatime" ? (
          <>
            {/* Six stat cards, two across. */}
            <SkeletonGrid count={6} columns={2} height={76} />

            {/* Top Languages and Category & OS, side by side from `md`. */}
            <div className="mt-4 flex flex-col gap-6 sm:gap-4 md:flex-row">
              <SkeletonBlock className="flex-1 h-40 rounded-lg sm:rounded-xl" />
              <SkeletonBlock className="flex-1 h-40 rounded-lg sm:rounded-xl" />
            </div>
          </>
        ) : (
          <>
            <SkeletonGrid count={4} columns={4} height={76} />

            {/*
              The contribution heatmap: seven rows of cells over a month strip,
              with a legend beneath. It scrolls sideways on a narrow screen, so
              the height is what matters and it is the same at every width.
            */}
            <SkeletonBlock className="mt-4 h-[168px] border-0 bg-zinc-900/40" />
          </>
        )}
      </div>
    </div>
  );
}
