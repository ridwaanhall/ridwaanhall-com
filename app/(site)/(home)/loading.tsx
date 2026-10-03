import {
  SkeletonBar,
  SkeletonPage,
  SkeletonRows,
  SkeletonSectionHeading,
  SkeletonTiles,
} from "@/components/skeleton";

/**
 * The home page, while it loads.
 *
 * **`(home)` is why this sits in a group of its own, and it is not cosmetic.**
 * A segment's loading module is applied to that segment's child slots, so while
 * this file lived at `app/(site)/` it was the fallback for every route in the
 * group -- and it won, because on a navigation the target's own skeleton is
 * still inside the payload being waited for. The group is a router segment but
 * not a path, so it moves this down to a node with no routes under it.
 * `scripts/check-skeleton-scope.mjs` is what keeps it there.
 *
 * Mirrors the hero, selected work, the latest-writing rows and the ticker.
 */
export default function Loading() {
  return (
    <SkeletonPage>
      <section className="pt-16 pb-16 md:pt-32 md:pb-24">
        <SkeletonBar className="h-3 w-64" />
        <SkeletonBar className="mt-8 h-9 w-3/5 max-w-xl sm:h-12 md:h-16" />
        <SkeletonBar className="mt-4 h-6 w-4/5 max-w-2xl md:h-7" />
        <SkeletonBar className="mt-9 h-5 w-full max-w-2xl" />
        <SkeletonBar className="mt-3 h-5 w-2/3 max-w-xl" />
        <div className="mt-11 flex gap-3">
          {[0, 1, 2].map((i) => (
            <SkeletonBar key={i} className="h-11 w-28 rounded-full" />
          ))}
        </div>
      </section>

      <section className="py-14 md:py-20">
        <SkeletonSectionHeading />
        <SkeletonTiles />
      </section>

      <section className="py-14 md:py-20">
        <SkeletonSectionHeading />
        <SkeletonRows />
      </section>

      <section className="py-14 md:py-20">
        <SkeletonSectionHeading action={false} />
        {[0, 1].map((row) => (
          <div key={row} className="flex gap-10 overflow-hidden py-2.5">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonBar key={i} className="h-5 w-24 flex-none" />
            ))}
          </div>
        ))}
      </section>
    </SkeletonPage>
  );
}
