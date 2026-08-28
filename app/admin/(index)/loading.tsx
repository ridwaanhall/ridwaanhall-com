import { SkeletonBar } from "@/components/skeleton";

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
 * The card counts are the first three groups' real sizes, so the first screen
 * is filled to roughly the height the page arrives at rather than collapsing
 * by half of it.
 *
 * No `SkeletonPage` -- the admin has its own chrome and its own gutters, which
 * `AdminMain` supplies.
 */
export default function Loading() {
  return (
    <div className="skeleton-pulse space-y-9" role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="space-y-9" aria-hidden="true">
        <div className="border-b border-zinc-800 pb-5">
          <SkeletonBar className="h-8 w-28" />
          <SkeletonBar className="mt-2 h-4 w-96 max-w-full" />
          <SkeletonBar className="mt-3 h-3 w-40" />
        </div>

        {[9, 1, 1].map((cards, group) => (
          <section key={group}>
            <div className="mb-3 flex items-center gap-2.5">
              <SkeletonBar className="h-7 w-7 rounded-md" />
              <SkeletonBar className="h-3.5 w-24" />
              <span aria-hidden="true" className="ml-1 h-px flex-1 bg-zinc-800" />
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: cards }, (_, card) => (
                <div key={card} className="rounded-lg border border-zinc-800 p-3.5">
                  <SkeletonBar className="h-4 w-32" />
                  <SkeletonBar className="mt-2.5 h-3 w-full" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
