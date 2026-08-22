import { SkeletonBar, SkeletonGrid, SkeletonPage } from "@/components/skeleton";
import { LISTING_CARD_HEIGHT } from "@/components/site/listing-results";

/** The projects index, while it loads. No slider, otherwise the blog index. */
export default function Loading() {
  return (
    <SkeletonPage>
      <div className="space-y-8">
        <div className="mt-4 sm:mt-6 mb-4 sm:mb-6">
          <SkeletonBar className="h-8 w-52 mb-3" />
          <SkeletonBar className="h-4 w-full max-w-2xl mb-2" />
          <SkeletonBar className="h-4 w-3/5 max-w-lg" />
        </div>

        <div className="mb-4 flex justify-end">
          <SkeletonBar className="h-10 w-full sm:max-w-sm md:max-w-md" />
        </div>

        <SkeletonGrid count={4} columns={2} height={LISTING_CARD_HEIGHT} />
      </div>
    </SkeletonPage>
  );
}
