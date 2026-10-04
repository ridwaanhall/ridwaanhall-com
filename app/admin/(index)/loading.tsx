import { ScreenHeadSkeleton, SkeletonBar } from "@/components/skeleton";

/**
 * The admin index, while it loads.
 *
 * These are the admin's most-earned skeletons: every route under `/admin` sets
 * `instant = false`, so each navigation is a real round trip rather than a
 * cached shell, and a skeleton is what the reader looks at every single time.
 *
 * **Which is why `(index)` matters more here than anywhere else on the site.**
 * A segment's loading module covers that segment's child slots, so at
 * `app/admin/` this file was the fallback for every changelist and every
 * record form -- and with nothing prerendered, that slow path was the only
 * path, so a click on any model drew the index's groups of cards before the
 * screen it was actually opening. The group takes it out of their way.
 * `scripts/check-skeleton-scope.mjs` keeps it out.
 *
 * **It names nothing.** Not a group, not a model, not a count that could be
 * read as one -- the same rule `record-skeleton.tsx` records, and for the same
 * reason: a skeleton is drawn before anything is known about who is asking, and
 * `check-admin.mjs` treats the model index as something an anonymous reader
 * must not receive. The shape is copied from the page; the words are not.
 *
 * The row counts are the first three groups' real sizes, so the first screen
 * is filled to roughly the height the page arrives at rather than collapsing
 * by half of it.
 *
 * No page frame of its own -- the admin has its own chrome and its own
 * gutters, which `AdminMain` supplies.
 */
export default function Loading() {
  return (
    <div className="skeleton-pulse space-y-14" role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="space-y-14" aria-hidden="true">
        <ScreenHeadSkeleton meta />

        {[6, 1, 1].map((rows, group) => (
          <section key={group} className="grid gap-5 lg:grid-cols-12 lg:gap-10">
            <SkeletonBar className="h-6 w-24 lg:col-span-3" />
            <div className="grid gap-x-10 border-t border-zinc-800 sm:grid-cols-2 lg:col-span-9">
              {Array.from({ length: rows }, (_, row) => (
                <div key={row} className="border-b border-zinc-800 py-4">
                  <SkeletonBar className="h-[18px] w-32" />
                  <SkeletonBar className="mt-2 h-4 w-full max-w-xs" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
