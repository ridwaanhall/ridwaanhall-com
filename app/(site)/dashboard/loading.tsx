import { HeadSkeleton, PageSkeleton, PanelSkeleton } from "@/components/foothill/skeleton";

/** The dashboard while it loads: the heading and facts, then the panels' frames. */
export default function Loading() {
  return (
    <PageSkeleton>
      <HeadSkeleton facts={3} />
      <div className="wrap dash">
        <PanelSkeleton h={150} />
        <PanelSkeleton h={260} />
        <div className="dgrid two">
          <PanelSkeleton h={200} />
          <PanelSkeleton h={200} />
        </div>
        <PanelSkeleton h={320} />
      </div>
    </PageSkeleton>
  );
}
