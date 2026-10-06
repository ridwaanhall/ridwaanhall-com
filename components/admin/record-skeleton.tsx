import { ScreenHeadSkeleton, SkeletonBar } from "@/components/skeleton";

/**
 * The change form's frame, with nothing in it.
 *
 * This is prerendered and served before anything is known about who is asking,
 * so it carries no record and no account -- not even which model is being
 * opened, since that arrives with the URL. `check-admin.mjs` reads whole
 * response bodies, payload included, and that is only survivable because there
 * is nothing here to leak.
 *
 * Its own module because six places want it: the `[sub]/(index)` and
 * `[sub]/[id]` pages' own `<Suspense>` fallbacks, and the `loading.tsx` beside
 * each of those two plus `[sub]/new` and the flat `[model]/new`.
 *
 * The legend bar above the rows is not decoration. A fieldset's name sits
 * above its rule, so leaving it out made the rows land higher than the
 * skeleton had promised -- the same class of drift as a listing skeleton that
 * omits the search row above its grid.
 */
export function RecordSkeleton() {
  return (
    <div className="skeleton-pulse" role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="space-y-8" aria-hidden="true">
        {/* Breadcrumb, then the record's title and the line under it. */}
        <SkeletonBar className="h-3 w-24" />
        <ScreenHeadSkeleton lead={false} meta />

        <div>
          <SkeletonBar className="mb-3 h-6 w-28" />
          <div className="divide-y divide-zinc-800 border-y border-zinc-800">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="grid gap-1.5 py-3.5 sm:grid-cols-3 sm:gap-6">
                <SkeletonBar className="mt-2 h-4 w-20" />
                <SkeletonBar className="h-[42px] rounded-md sm:col-span-2" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SkeletonBar className="h-9 w-20 rounded-full" />
          <SkeletonBar className="h-8 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}
