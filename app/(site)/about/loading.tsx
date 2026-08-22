import { SkeletonBar, SkeletonBlock, SkeletonPage, SkeletonText } from "@/components/skeleton";

/**
 * The about page, while it loads.
 *
 * Six tabs across the top, then whichever panel is open -- Intro by default,
 * which is the CV banner over one bordered letter.
 */
export default function Loading() {
  return (
    <SkeletonPage gutter="article">
      <div className="mb-4 md:mb-6">
        <SkeletonBar className="h-8 w-44 mb-3" />
        <SkeletonBar className="h-4 w-full max-w-2xl mb-2" />
        <SkeletonBar className="h-4 w-3/5 max-w-lg" />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <SkeletonBar key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
        {/* The CV download banner. */}
        <SkeletonBlock className="h-24" />

        <div className="border border-zinc-700 rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-y-2 mb-2 sm:mb-3">
            <SkeletonBar className="h-6 w-48" />
            <div className="flex flex-wrap gap-1.5">
              <SkeletonBar className="h-5 w-24 rounded-full" />
              <SkeletonBar className="h-5 w-20 rounded-full" />
            </div>
          </div>
          <SkeletonText lines={7} />
          <SkeletonBar className="h-6 w-52 mt-3" />
        </div>
      </div>
    </SkeletonPage>
  );
}
