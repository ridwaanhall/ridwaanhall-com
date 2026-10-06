import { ScreenHeadSkeleton, SkeletonBar } from "@/components/skeleton";

/**
 * The access matrix's frame, with nothing in it.
 *
 * Its own skeleton rather than `RecordSkeleton`, because the shape underneath
 * is genuinely different: a record form is a column of label/control rows, and
 * this is a role card followed by grouped tables of checkboxes. Standing the
 * wrong one in front of it is the drift this repository keeps catching -- the
 * right height with the wrong furniture still makes the page appear to rebuild
 * itself when the real thing lands.
 *
 * The group count is the registry's nine less the Access group itself, which
 * is not grantable. It is written as a number rather than imported: a skeleton
 * that grows a row when a group is added is a skeleton that has to be measured
 * again anyway, and `scripts/check-skeleton-shape.mjs` is what measures it.
 *
 * A `<div>`, never a `<main>`: `#page-content main` carries the entrance fade,
 * and a skeleton that renders one plays it before the page can.
 */
export function AccessSkeleton() {
  return (
    <div className="skeleton-pulse" role="status" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="space-y-8" aria-hidden="true">
        {/* Breadcrumb, then the account's username and the line under it. */}
        <SkeletonBar className="h-3 w-16" />
        <ScreenHeadSkeleton lead={false} meta />

        {/* The role: its title, then one checkbox row and a note between rules. */}
        <div>
          <SkeletonBar className="mb-3 h-6 w-14" />
          <div className="space-y-2.5 border-y border-zinc-800 py-4">
            <SkeletonBar className="h-4 w-28" />
            <SkeletonBar className="h-3.5 w-96 max-w-full" />
          </div>
        </div>

        {/* Three of the eight groups, which is what fits above the fold. The
            rest arrive below it and cost nothing to be wrong about. */}
        <div>
          <SkeletonBar className="mb-3 h-6 w-20" />
          <div className="space-y-4">
            {/* The presets, between rules above the groups: a label, three
                pills and a note. Drawn rather than left out, because it stands
                between the title and the first group -- leaving it out is how a
                page settles by jumping. */}
            <div className="space-y-2.5 border-y border-zinc-800 py-4">
              <div className="flex items-center gap-2">
                <SkeletonBar className="h-3.5 w-16" />
                <SkeletonBar className="h-6 w-16 rounded-full" />
                <SkeletonBar className="h-6 w-20 rounded-full" />
                <SkeletonBar className="h-6 w-20 rounded-full" />
              </div>
              <SkeletonBar className="h-3.5 w-80 max-w-full" />
            </div>

            {[0, 1, 2].map((group) => (
              <div key={group} className="pt-4">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-2.5">
                  <SkeletonBar className="h-5 w-24" />
                  <SkeletonBar className="ml-auto h-6 w-16 rounded-full" />
                </div>
                <div className="border-b border-zinc-800/60 px-3 py-2">
                  <SkeletonBar className="h-3 w-full max-w-md" />
                </div>
                {[0, 1, 2].map((row) => (
                  <div key={row} className="border-b border-zinc-800/60 px-3 py-2 last:border-b-0">
                    <SkeletonBar className="h-4 w-full max-w-md" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* The save bar. */}
        <div className="flex items-center gap-3">
          <SkeletonBar className="h-9 w-20 rounded-full" />
          <SkeletonBar className="h-8 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}
