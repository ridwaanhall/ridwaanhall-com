import { SkeletonBar } from "@/components/skeleton";

/**
 * A changelist, while it loads.
 *
 * The table is held at ten rows: enough that the filter bar and the header do
 * not sit alone above white space, and short enough that a model with three
 * records does not collapse by half a screen when it arrives.
 *
 * The toolbar is drawn as the bordered strip it now is, not as loose controls.
 * That distinction is exactly the drift this repository keeps catching: a
 * skeleton that is the right height and the wrong furniture still makes the
 * page appear to rebuild itself, because the border it was missing arrives as
 * a new box around things that were already on screen.
 *
 * A singleton model renders its record form here instead of a table, which
 * this cannot know yet. The table is the far commoner case and the one worth
 * matching.
 */
export default function Loading() {
  return (
    <div className="skeleton-pulse space-y-4" role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="space-y-4" aria-hidden="true">
        <div>
          <SkeletonBar className="h-6 w-40" />
          <SkeletonBar className="mt-2 h-4 w-80 max-w-full" />
        </div>

        {/* Search box, filter selects, the count chip and the add button. */}
        <div className="rounded-lg border border-zinc-800 p-2.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2.5">
            <SkeletonBar className="h-8 w-56 sm:w-72" />
            <SkeletonBar className="h-8 w-20" />
            <SkeletonBar className="h-8 w-32" />
            <SkeletonBar className="ml-auto h-7 w-24 rounded-full" />
            <SkeletonBar className="h-8 w-20 rounded-full" />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <div className="border-b border-zinc-800 px-3 py-2.5">
            <SkeletonBar className="h-3 w-full max-w-2xl" />
          </div>
          {Array.from({ length: 10 }, (_, row) => (
            <div key={row} className="border-b border-zinc-900 px-3 py-3 last:border-b-0">
              <SkeletonBar className="h-3.5 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
