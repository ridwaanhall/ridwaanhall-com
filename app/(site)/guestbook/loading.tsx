import { Bar, HeadSkeleton, PageSkeleton } from "@/components/foothill/skeleton";

/** The guestbook while it loads: the heading beside the conversation's frame. */
export default function Loading() {
  return (
    <PageSkeleton>
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <HeadSkeleton />
        </div>
        <div className="lg:col-span-8">
          <div className="overflow-hidden rounded-lg border border-line">
            <div className="border-b border-line px-5 py-3.5">
              <Bar className="h-3 w-24" />
            </div>
            <div className="h-[min(68vh,720px)]" />
            <div className="border-t border-line px-5 py-4">
              <Bar className="h-[58px] w-full" />
            </div>
          </div>
        </div>
      </div>
    </PageSkeleton>
  );
}
