import { SkeletonBar, SkeletonGrid } from "@/components/skeleton";

/**
 * The blog and project listings, while their results resolve.
 *
 * Its own module, away from `listing-results.tsx`, for the reason
 * `dashboard-skeleton.tsx` and the guestbook's panel skeleton are also their
 * own: both a `loading.tsx` and the page need it, and importing it from the
 * results module would pull `lib/data/content` -- and therefore the database
 * client -- into a fallback that only draws rectangles.
 *
 * **`ListingBody` exists so the two moments agree.** A listing is covered
 * twice: once by `loading.tsx` before anything has arrived, and again by the
 * `<Suspense>` fallback around the results once the shell is up. Those were
 * separate pieces of markup, and they disagreed -- the second held the grid but
 * not the search row above it, which is inside the same boundary, so the grid
 * dropped by the height of a form field the moment the results came back. One
 * definition, used by both, is what stops that being possible.
 */
export function ListingBody({ columns = 2 }: { columns?: 2 | 4 }) {
  return (
    <>
      {/* The search box, right-aligned above the grid, at the width
          `SearchForm` gives itself. */}
      <div className="mb-4 flex justify-end">
        <SkeletonBar className="h-10 w-full sm:max-w-sm md:max-w-md" />
      </div>

      <SkeletonGrid count={4} columns={columns} height={LISTING_CARD_HEIGHT} />
    </>
  );
}

/**
 * Shown while the results resolve.
 *
 * Sized to the real grid so the page does not jump when they arrive -- the
 * whole point of holding the space is that nothing below it moves. 350px is
 * the height `BlogCard` and `ProjectCard` both set on themselves.
 */
export const LISTING_CARD_HEIGHT = 350;

export function ListingSkeleton({ columns = 2 }: { columns?: 2 | 4 }) {
  return (
    <div className="skeleton-pulse" role="status" aria-busy="true">
      <span className="sr-only">Loading results…</span>
      <div aria-hidden="true">
        <ListingBody columns={columns} />
      </div>
    </div>
  );
}
