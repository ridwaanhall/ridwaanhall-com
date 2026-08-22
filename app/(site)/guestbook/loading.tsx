import { SkeletonBar, SkeletonPage } from "@/components/skeleton";
import { GuestbookPanelSkeleton } from "@/components/site/guestbook/panel-skeleton";

/** The guestbook, while it loads. */
export default function Loading() {
  return (
    <SkeletonPage gutter="article">
      <div className="mb-4 md:mb-6">
        <SkeletonBar className="h-8 w-40 mb-3" />
        <SkeletonBar className="h-4 w-full max-w-2xl mb-2" />
        <SkeletonBar className="h-4 w-3/5 max-w-lg" />
      </div>

      <GuestbookPanelSkeleton />
    </SkeletonPage>
  );
}
