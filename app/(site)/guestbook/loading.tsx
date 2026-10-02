import { SkeletonPage, SkeletonPageHeading } from "@/components/skeleton";
import { GuestbookPanelSkeleton } from "@/components/site/guestbook/panel-skeleton";

/** The guestbook, while it loads. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeading />
      <div className="border-t border-zinc-800 pt-12 pb-8 md:pt-16">
        <GuestbookPanelSkeleton />
      </div>
    </SkeletonPage>
  );
}
