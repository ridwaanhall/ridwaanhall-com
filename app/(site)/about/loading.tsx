import { SkeletonBar, SkeletonBlock, SkeletonPage, SkeletonText } from "@/components/skeleton";

/**
 * The about page, while it loads.
 *
 * Six tabs across the top, then whichever panel is open -- Intro by default,
 * which is the CV banner over one bordered letter.
 *
 * **The letter is the whole page and has to be drawn like it.** This used to
 * sketch seven lines of it and stop, which came to 569px against a page of
 * 1513: the skeleton ended a third of the way up the window and left the rest
 * blank until the real thing arrived, so the reader watched an empty screen
 * fill from the top rather than a page settle into place. The letter runs to
 * about 1300px; what is drawn here is the first screen of it, which is all a
 * skeleton owes -- nothing below the fold can jump before it is scrolled to.
 * `scripts/check-skeleton-shape.mjs` measures exactly that.
 */
export default function Loading() {
  return (
    <SkeletonPage gutter="article">
      <div className="mb-4 md:mb-6">
        <SkeletonBar className="h-8 w-44 mb-3" />
        <SkeletonBar className="h-5 w-full max-w-2xl mb-2" />
        <SkeletonBar className="h-5 w-3/5 max-w-lg" />
      </div>

      {/* The tab strip: `p-2 sm:p-4` buttons over a rule, as `AboutTabs` draws
          them, so the panel below starts at the same line. */}
      <div className="mb-6 border-b border-zinc-700">
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonBar key={i} className="h-9 sm:h-13 w-20 sm:w-24 rounded-t-lg" />
          ))}
        </div>
      </div>

      <div className="mt-4 sm:mt-6">
        {/* The CV download banner. */}
        <SkeletonBlock className="h-24" />

        <div className="mt-3 sm:mt-4 border border-zinc-700 rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-y-2 mb-2 sm:mb-3">
            <SkeletonBar className="h-6 w-48" />
            <div className="flex flex-wrap gap-1.5">
              <SkeletonBar className="h-5 w-24 rounded-full" />
              <SkeletonBar className="h-5 w-20 rounded-full" />
            </div>
          </div>
          <SkeletonText lines={24} />
          <SkeletonBar className="h-6 w-52 mt-3" />
        </div>
      </div>
    </SkeletonPage>
  );
}
