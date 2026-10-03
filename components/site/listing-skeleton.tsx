import { SkeletonBar, SkeletonRows, SkeletonTiles } from "@/components/skeleton";

/**
 * What the blog and project listings show while their results stream in.
 *
 * Two shapes, matching `BlogList` (ruled rows) and `ProjectGrid` (image tiles),
 * each under the count-and-search row both listings open with. The route
 * skeletons in `loading.tsx` reuse `ListingBody`, so a first visit and a
 * search on an already-open page settle into the same layout.
 */
export type ListingShape = "rows" | "tiles";

export function ListingBody({ shape = "rows" }: { shape?: ListingShape }) {
  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SkeletonBar className="h-3 w-20" />
        <SkeletonBar className="h-11 w-full rounded-full sm:max-w-md" />
      </div>
      {shape === "rows" ? <SkeletonRows count={6} /> : <SkeletonTiles count={4} />}
    </>
  );
}

export function ListingSkeleton({ shape = "rows" }: { shape?: ListingShape }) {
  return (
    <div className="skeleton-pulse" role="status" aria-busy="true">
      <span className="sr-only">Loading results…</span>
      <div aria-hidden="true">
        <ListingBody shape={shape} />
      </div>
    </div>
  );
}
