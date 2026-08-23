import { SkeletonBar, SkeletonPage } from "@/components/skeleton";
import { ListingBody } from "@/components/site/listing-skeleton";

/**
 * The projects index, while it loads.
 *
 * **`gutter="article"`, which is the one the page uses.** It held the roomier
 * one, and the two are indistinguishable from `sm` upwards -- `md:px-6 lg:px-8`
 * is common to both -- so on a desktop the mistake was invisible while on a
 * phone the entire column stepped sideways and up as the page landed. This is
 * the one route of ten where they disagreed, and
 * `scripts/check-skeleton-shape.mjs` measures at 375 precisely because that is
 * the only width at which it shows.
 *
 * The body is `ListingBody`, the same piece the results boundary falls back to,
 * so the two moments of this page cannot draw different things.
 */
export default function Loading() {
  return (
    <SkeletonPage gutter="article">
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
