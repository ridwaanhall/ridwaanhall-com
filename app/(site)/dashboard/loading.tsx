import { SkeletonPage } from "@/components/skeleton";
import { DashboardPanelSkeleton } from "@/components/site/dashboard-skeleton";
import { PageHeaderSkeleton } from "@/components/site/ui/page-header";

/**
 * The dashboard, while it loads.
 *
 * The same five panel skeletons the page's own `<Suspense>` boundaries use, so
 * the wait before the shell arrives looks like the wait after it.
 */
export default function Loading() {
  return (
    <SkeletonPage>
      <PageHeaderSkeleton />

      <DashboardPanelSkeleton panel="today" />
      <DashboardPanelSkeleton panel="wakatime" />
      <DashboardPanelSkeleton panel="year" />
      <DashboardPanelSkeleton panel="rhythm" />
      <DashboardPanelSkeleton panel="github" />
    </SkeletonPage>
  );
}
