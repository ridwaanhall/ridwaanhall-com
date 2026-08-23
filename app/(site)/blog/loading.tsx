import { SkeletonBar, SkeletonBlock, SkeletonPage } from "@/components/skeleton";
import { ListingBody } from "@/components/site/listing-skeleton";

/**
 * The blog index, while it loads.
 *
 * The featured slider's photo is `h-60 sm:h-72 md:h-80`, and below it is
 * `ListingBody` -- the same piece the results boundary falls back to once the
 * shell has arrived, so the search row and the grid are drawn identically at
 * both moments.
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

        <ListingBody />
      </div>
    </SkeletonPage>
  );
}
