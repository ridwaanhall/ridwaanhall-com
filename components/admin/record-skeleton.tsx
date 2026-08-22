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

        <div className="space-y-3 rounded-lg border border-zinc-800 px-3 py-4">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="grid gap-2 sm:grid-cols-3 sm:gap-4">
              <SkeletonBar className="h-3 w-20" />
              <SkeletonBar className="h-8 sm:col-span-2" />
            </div>
          ))}
        </div>

        <SkeletonBar className="h-8 w-24 rounded-full" />
      </div>
    </div>
  );
}
