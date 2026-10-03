import { SkeletonPage, SkeletonPageHeading } from "@/components/skeleton";
import { ListingBody } from "@/components/site/listing-skeleton";

/**
 * The projects index, while it loads: the header, then `ListingBody` -- the
 * same piece the results boundary falls back to, so the count-and-search row
 * and the tiles are drawn identically at both moments.
 */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeading />
      <div className="pt-4 pb-4">
        <ListingBody shape="tiles" />
      </div>
    </SkeletonPage>
  );
}
