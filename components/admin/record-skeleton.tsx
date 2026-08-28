import { SkeletonBar } from "@/components/skeleton";

/**
 * The change form's frame, with nothing in it.
 *
 * This is prerendered and served before anything is known about who is asking,
 * so it carries no record and no account -- not even which model is being
 * opened, since that arrives with the URL. `check-admin.mjs` reads whole
 * response bodies, payload included, and that is only survivable because there
 * is nothing here to leak.
 *
 * Its own module because three places want it: the detail page's own
 * `<Suspense>`, and the `loading.tsx` of both the detail and the create route.
 *
 * The legend bar above the card is not decoration. A fieldset's name sits
 * *outside* its card, so leaving it out made the card land 18px higher than the
 * skeleton had promised -- the same class of drift as a listing skeleton that
 * omits the search row above its grid.
 */
export function RecordSkeleton() {
  return (
    <div className="skeleton-pulse space-y-5" role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="space-y-5" aria-hidden="true">
        {/* Breadcrumb, then the record's title and its subtitle. */}
        <SkeletonBar className="h-3 w-24" />
        <div className="space-y-2">
          <SkeletonBar className="h-6 w-64" />
          <SkeletonBar className="h-3 w-28" />
        </div>

        <div>
          <SkeletonBar className="mb-1.5 h-3 w-20" />
          <div className="space-y-3 rounded-lg border border-zinc-800 px-3.5 py-4">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="grid gap-2 sm:grid-cols-3 sm:gap-4">
                <SkeletonBar className="h-3 w-20" />
                <SkeletonBar className="h-8 sm:col-span-2" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SkeletonBar className="h-8 w-24 rounded-full" />
          <SkeletonBar className="h-8 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}
