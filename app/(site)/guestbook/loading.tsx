import { SkeletonPage } from "@/components/skeleton";
import { GuestbookPanelSkeleton } from "@/components/site/guestbook/panel-skeleton";
import { PageHeaderSkeleton } from "@/components/site/ui/page-header";

/** The guestbook, while it loads. */
export default function Loading() {
  return (
    <SkeletonPage>
      <PageHeaderSkeleton />

      <GuestbookPanelSkeleton />
    </SkeletonPage>
  );
}
