import { SkeletonBar, SkeletonBlock, SkeletonPage } from "@/components/skeleton";

/**
 * The careers page, while it loads.
 *
 * Whether it opens with tabs depends on which of the two flags are set, and
 * that is not known yet -- so this sketches the section cards they both lead
 * to and leaves the tab strip out rather than guessing wrong.
 */
export default function Loading() {
  return (
    <SkeletonPage gutter="article">
      <div className="mb-4 md:mb-6">
        <SkeletonBar className="h-8 w-64 mb-3" />
        <SkeletonBar className="h-4 w-full max-w-2xl mb-2" />
        <SkeletonBar className="h-4 w-3/5 max-w-lg" />
      </div>

      <div className="mt-4 sm:mt-6 space-y-4">
        {[0, 1, 2, 3].map((card) => (
          <SkeletonBlock key={card} className="p-4">
            {/* A section card: icon, title, optional status pill, then rows. */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <SkeletonBar className="h-5 w-5 rounded" />
                <SkeletonBar className="h-5 w-44" />
              </div>
              <SkeletonBar className="h-5 w-24 rounded-full" />
            </div>
            <div className="space-y-2">
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex justify-between gap-4">
                  <SkeletonBar className="h-4 w-40" />
                  <SkeletonBar className="h-4 w-28" />
                </div>
              ))}
            </div>
          </SkeletonBlock>
        ))}
      </div>
    </SkeletonPage>
  );
}
