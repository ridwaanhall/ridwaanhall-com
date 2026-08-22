import { SkeletonBar, SkeletonGrid } from "@/components/skeleton";

/**
 * One dashboard panel, holding its height while its API answers.
 *
 * Its own module because `loading.tsx` needs it as well as the page does, and a
 * `loading.tsx` importing from a sibling `page.tsx` would drag the page's data
 * imports into the fallback for no reason.
 *
 * The two column counts are written out rather than interpolated: Tailwind
 * generates a class only if it can see it in the source, so
 * `lg:grid-cols-${columns}` would produce no rule at all.
 */
export function DashboardPanelSkeleton({ columns }: { columns: 2 | 4 }) {
  return (
    <div className="skeleton-pulse mb-6" role="status" aria-busy="true">
      <span className="sr-only">Loading statistics…</span>
      <div aria-hidden="true">
        <SkeletonBar className="h-8 w-56 mb-4 bg-zinc-900/60" />
        <SkeletonGrid count={4} columns={columns} height={80} />
      </div>
    </div>
  );
}
