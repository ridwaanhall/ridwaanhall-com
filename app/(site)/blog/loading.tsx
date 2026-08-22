import { SkeletonBar, SkeletonBlock, SkeletonGrid, SkeletonPage } from "@/components/skeleton";
import { LISTING_CARD_HEIGHT } from "@/components/site/listing-results";

/**
 * The blog index, while it loads.
 *
 * The featured slider's photo is `h-60 sm:h-72 md:h-80`, and the grid below it
 * is the same one `ListingSkeleton` already stands in for once the shell has
 * arrived -- this covers the moment before it.
 */
export default function Loading() {
  return (
    <SkeletonPage>
      <div className="space-y-8">
        <SkeletonBlock className="h-60 sm:h-72 md:h-80 mb-4 sm:mb-6 border-zinc-800" />

        <div className="mt-4 sm:mt-6 mb-4 sm:mb-6">
          <SkeletonBar className="h-8 w-48 mb-3" />
          <SkeletonBar className="h-4 w-full max-w-2xl mb-2" />
          <SkeletonBar className="h-4 w-3/5 max-w-lg" />
        </div>

        {/* The search box sits above the grid, right-aligned. */}
        <div className="mb-4 flex justify-end">
          <SkeletonBar className="h-10 w-full sm:max-w-sm md:max-w-md" />
        </div>

        <SkeletonGrid count={4} columns={2} height={LISTING_CARD_HEIGHT} />
      </div>
    </SkeletonPage>
  );
}
