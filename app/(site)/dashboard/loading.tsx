import { HeadSkeleton, PageSkeleton, PanelSkeleton } from "@/components/foothill/skeleton";

/** The dashboard while it loads: the heading and facts, then the panels' frames. */
export default function Loading() {
  return (
    <PageSkeleton>
      <HeadSkeleton facts={3} />
      <div className="wrap dash">
        {/* The first four of the page's own fallbacks, at the same heights. */}
        <PanelSkeleton h={336} phone={418} />
        <PanelSkeleton h={368} phone={823} />
        <div className="dgrid two">
          <PanelSkeleton h={386} phone={325} />
          <PanelSkeleton h={386} phone={325} />
        </div>
        <PanelSkeleton h={545} phone={902} />
      </div>
    </PageSkeleton>
  );
}
