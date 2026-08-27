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
export function DashboardPanelSkeleton({ panel }: { panel: "wakatime" | "github" | "year" }) {
  return (
    <div className="skeleton-pulse mb-6" role="status" aria-busy="true">
      <span className="sr-only">Loading statistics…</span>
      <div aria-hidden="true">
        {/* The panel heading and the caption opposite it. */}
        <div className="flex flex-row items-center justify-between gap-2 mb-3 md:mb-4">
          <SkeletonBar className="h-7 w-56 bg-zinc-900/60" />
          <SkeletonBar className="h-4 w-24 bg-zinc-900/60" />
        </div>

        {panel === "year" ? (
          <>
            {/*
              Eight cards four across, then the AI/human split bar, then the
              heatmap and three breakdown panels. The panels are three separate
              blocks rather than one wide one because below `lg` they stack, and
              a single block would understate the section by two panel heights
              on exactly the screens where the jump is worst.
            */}
            <SkeletonGrid count={8} columns={4} mobileColumns={2} height={76} />
            <SkeletonBlock className="mt-3 sm:mt-4 h-[88px] rounded-lg sm:rounded-xl" />
            <SkeletonBlock className="mt-4 h-[168px] border-0 bg-zinc-900/40" />
            <div className="mt-4 grid gap-6 sm:gap-4 lg:grid-cols-3">
              <SkeletonBlock className="h-[152px] rounded-lg sm:rounded-xl" />
              <SkeletonBlock className="h-[152px] rounded-lg sm:rounded-xl" />
              <SkeletonBlock className="h-[152px] rounded-lg sm:rounded-xl" />
            </div>
          </>
        ) : panel === "wakatime" ? (
          <>
            {/* Six stat cards, two across. */}
            <SkeletonGrid count={6} columns={2} height={76} />

            {/* Languages, Categories and Editors: three across from `lg`. */}
            <div className="mt-4 grid gap-6 sm:gap-4 lg:grid-cols-3">
              <SkeletonBlock className="h-[152px] rounded-lg sm:rounded-xl" />
              <SkeletonBlock className="h-[152px] rounded-lg sm:rounded-xl" />
              <SkeletonBlock className="h-[152px] rounded-lg sm:rounded-xl" />
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
            <div className="mt-6 flex flex-row items-center justify-between gap-2 mb-3 md:mb-4">
              <SkeletonBar className="h-7 w-56 bg-zinc-900/60" />
              <SkeletonBar className="h-4 w-24 bg-zinc-900/60" />
            </div>
            <SkeletonGrid count={8} columns={4} mobileColumns={2} height={76} />
            <SkeletonBlock className="mt-3 sm:mt-4 h-[88px] rounded-lg sm:rounded-xl" />
            <div className="mt-4 flex flex-col gap-6 sm:gap-4 md:flex-row">
              <SkeletonBlock className="flex-1 h-[152px] rounded-lg sm:rounded-xl" />
              <SkeletonBlock className="flex-1 h-[152px] rounded-lg sm:rounded-xl" />
            </div>
          </>
        ) : (
          <>
            <SkeletonGrid count={4} columns={4} mobileColumns={2} height={76} />

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
