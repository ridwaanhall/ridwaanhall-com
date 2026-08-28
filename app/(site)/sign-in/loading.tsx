import { SkeletonBar, SkeletonBlock, SkeletonPage } from "@/components/skeleton";

/**
 * The sign-in page, while it loads.
 *
 * The shape is the card the page renders: its heading, the three lines of copy
 * that fit `max-w-sm`, and the two provider buttons at the `h-9` their `py-2`
 * gives them. `rounded-lg` over `SkeletonBlock`'s `rounded-xl`, because that is
 * what the real card wears and `cn` lets the later utility win.
 *
 * **It exists because nothing else would answer for this route.** The group
 * carries no skeleton of its own -- see `scripts/check-skeleton-scope.mjs` for
 * why it must not -- so a route without a file here simply keeps the previous
 * page on screen until its payload lands.
 *
 * `scripts/check-skeleton-shape.mjs` has never caught this one rendering: it
 * defeats prefetching and holds the navigation, and `/sign-in` still arrives
 * with its card rather than with a skeleton. `/contact` and `/guestbook` both
 * ship a `loading.tsx` that goes unobserved the same way, so this is the
 * repository's existing position and not a new one -- the harness reports it as
 * a note rather than a failure, and the route is listed there so the day it
 * does render is the day it starts being measured.
 */
export default function Loading() {
  return (
    <SkeletonPage gutter="article">
      <div className="flex min-h-[60vh] items-center justify-center">
        <SkeletonBlock className="w-full max-w-sm rounded-lg p-6">
          <SkeletonBar className="h-7 w-20" />
          <div className="mt-2 space-y-2">
            <SkeletonBar className="h-5 w-full" />
            <SkeletonBar className="h-5 w-11/12" />
            <SkeletonBar className="h-5 w-2/5" />
          </div>
          <div className="mt-5 space-y-2">
            <SkeletonBar className="h-9 w-full rounded-full" />
            <SkeletonBar className="h-9 w-full rounded-full" />
          </div>
        </SkeletonBlock>
      </div>
    </SkeletonPage>
  );
}
