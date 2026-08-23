import { SkeletonBar, SkeletonBlock, SkeletonPage, SkeletonText } from "@/components/skeleton";

/**
 * A blog post, while it loads.
 *
 * The gallery is the tallest thing here and the one worth holding space for --
 * the body reflows around whatever it turns out to be, but the page jumping by
 * the height of a photo is the shift a reader notices.
 */
export default function Loading() {
  return (
    <SkeletonPage gutter="article">
      <header className="mb-6 md:mb-8">
        <SkeletonBar className="h-8 w-5/6 max-w-3xl mb-2 md:mb-3" />

        {/* Author avatar, name and dateline. */}
        <div className="flex flex-col mb-4 gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            <SkeletonBar className="w-8 h-8 sm:w-9 sm:h-9 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <SkeletonBar className="h-4 w-32" />
              <SkeletonBar className="h-3 w-48" />
            </div>
          </div>

          {/* The back button and the share row, one control group. */}
          <div className="flex flex-wrap gap-2 mt-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <SkeletonBar key={i} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full" />
            ))}
          </div>
        </div>

        <SkeletonBlock className="mb-6 md:mb-8 h-60 sm:h-72 md:h-96" />
      </header>

      <SkeletonText lines={9} className="max-w-none mb-8 md:mb-10" />

      <footer>
        <SkeletonBar className="h-6 w-20 mb-2 md:mb-3" />
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonBar key={i} className="h-6 w-20 rounded-full" />
          ))}
        </div>
      </footer>
    </SkeletonPage>
  );
}
