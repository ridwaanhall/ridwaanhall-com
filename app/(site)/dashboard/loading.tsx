import { SkeletonBar, SkeletonPage } from "@/components/skeleton";
import { DashboardPanelSkeleton } from "@/components/site/dashboard-skeleton";

/**
 * The dashboard, while it loads.
 *
 * The same two panel skeletons the page's own `<Suspense>` boundaries use, so
 * the wait before the shell arrives looks like the wait after it.
 */
export default function Loading() {
  return (
    <SkeletonPage gutter="article">
      <div className="mb-6 md:mb-8">
        <SkeletonBar className="h-8 w-44 mb-3" />
        <SkeletonBar className="h-4 w-full max-w-2xl mb-2" />
        <SkeletonBar className="h-4 w-3/5 max-w-lg" />
      </div>

      <DashboardPanelSkeleton columns={2} />
      <DashboardPanelSkeleton columns={4} />
    </SkeletonPage>
  );
}
