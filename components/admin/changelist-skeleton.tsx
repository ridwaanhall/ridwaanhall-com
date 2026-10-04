import { ScreenHeadSkeleton, SkeletonBar } from "@/components/skeleton";

/**
 * A changelist, while it loads.
 *
 * The table is held at ten rows: enough that the filter bar and the header do
 * not sit alone above white space, and short enough that a model with three
 * records does not collapse by half a screen when it arrives.
 *
 * The toolbar is drawn as loose pills over the table's opening rule, as the
 * real one is. That distinction is exactly the drift this repository keeps
 * catching: a skeleton that is the right height and the wrong furniture still
 * makes the page appear to rebuild itself, because a box it drew and the page
 * does not -- or the reverse -- is a frame appearing or vanishing around
 * things already on screen.
 *
 * A singleton model renders its record form here instead of a table, which
 * this cannot know yet. The table is the far commoner case and the one worth
 * matching.
 *
 * `heading` is false where the page has already drawn one. A section's tab
 * page renders its heading and its strip immediately and streams only the
 * list, so the bars for a title that is already on screen would be a second
 * title arriving under the first.
 */
export function ChangelistSkeleton({ heading = true }: { heading?: boolean }) {
  return (
    <div className="skeleton-pulse" role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="space-y-8" aria-hidden="true">
        {heading && <ScreenHeadSkeleton />}

        <div className="space-y-4">
          {/* Search box, filter selects, the count chip and the add button,
              straight on the page as the real ones are. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
            <SkeletonBar className="h-8 w-56 rounded-full sm:w-72" />
            <SkeletonBar className="h-8 w-20 rounded-full" />
            <SkeletonBar className="h-8 w-32 rounded-full" />
            <SkeletonBar className="ml-auto h-7 w-24 rounded-full" />
            <SkeletonBar className="h-8 w-20 rounded-full" />
          </div>

          <div className="border-t border-zinc-800">
            <div className="border-b border-zinc-800 px-3 py-2.5">
              <SkeletonBar className="h-3.5 w-full max-w-2xl" />
            </div>
            {Array.from({ length: 10 }, (_, row) => (
              <div key={row} className="border-b border-zinc-800/70 px-3 py-3 last:border-b-0">
                <SkeletonBar className="h-3.5 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
