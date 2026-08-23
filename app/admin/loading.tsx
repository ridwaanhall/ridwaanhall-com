import { SkeletonBar } from "@/components/skeleton";

/**
 * The admin index, while it loads.
 *
 * These are the admin's most-earned skeletons: every route under `/admin` sets
 * `instant = false`, so each navigation is a real round trip rather than a
 * cached shell, and this is what stands in for it every single time.
 *
 * No `SkeletonPage` -- the admin has its own chrome and its own gutters, which
 * `AdminMain` supplies.
 */
export default function Loading() {
  return (
    <div className="skeleton-pulse space-y-8" role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="space-y-8" aria-hidden="true">
        <div>
          <SkeletonBar className="h-6 w-24" />
          <SkeletonBar className="mt-2 h-4 w-80 max-w-full" />
        </div>

        {[0, 1, 2].map((group) => (
          <section key={group}>
            <SkeletonBar className="mb-2 h-3 w-28" />
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((card) => (
                <div key={card} className="rounded-lg border border-zinc-800 p-3">
                  <SkeletonBar className="h-4 w-32" />
                  <SkeletonBar className="mt-2 h-3 w-full" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
