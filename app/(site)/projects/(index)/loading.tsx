import { SkeletonBar, SkeletonPage } from "@/components/skeleton";
import { ListingBody } from "@/components/site/listing-skeleton";

/**
 * The projects index, while it loads.
 *
 * This route once held the wrong gutter of the two the site had. They were
 * indistinguishable from `sm` upwards, so on a desktop the mistake was
 * invisible while on a phone the whole column stepped sideways as the page
 * landed -- which is why `scripts/check-skeleton-shape.mjs` measures at 375.
 * There is one gutter now, in `PAGE_GUTTER`, so the mistake has no way left to
 * happen.
 *
 * The body is `ListingBody`, the same piece the results boundary falls back to,
 * so the two moments of this page cannot draw different things.
 */
export default function Loading() {
  return (
    <SkeletonPage>
      {/* Heading and lead, at the page's own `mb-6 md:mb-8`. */}
      <div className="mb-6 md:mb-8">
        <SkeletonBar className="h-8 w-52 mb-3" />
        <SkeletonBar className="h-5 w-full max-w-2xl mb-2" />
        <SkeletonBar className="h-5 w-3/5 max-w-lg" />
      </div>

      <ListingBody />
    </SkeletonPage>
  );
}
