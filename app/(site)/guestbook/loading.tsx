import { SkeletonPage, SkeletonPageHeading } from "@/components/skeleton";
import { GuestbookPanelSkeleton } from "@/components/site/guestbook/panel-skeleton";

/** The guestbook, while it loads. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeading />
      <div className="pt-4 pb-8">
        <GuestbookPanelSkeleton />
      </div>
    </SkeletonPage>
  );
}
