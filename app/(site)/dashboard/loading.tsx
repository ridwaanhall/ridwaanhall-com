import { SkeletonPage, SkeletonPageHeading } from "@/components/skeleton";
import { DashboardPanelSkeleton } from "@/components/site/dashboard-skeleton";

/**
 * The dashboard, while it loads.
 *
 * The same five panel skeletons the page's own `<Suspense>` boundaries use, so
 * the wait before the shell arrives looks like the wait after it.
 */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeading />

      <DashboardPanelSkeleton panel="today" />
      <DashboardPanelSkeleton panel="wakatime" />
      <DashboardPanelSkeleton panel="year" />
      <DashboardPanelSkeleton panel="rhythm" />
      <DashboardPanelSkeleton panel="github" />
      <div className="pb-8" />
    </SkeletonPage>
  );
}
