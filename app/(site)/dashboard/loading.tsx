import { Bar, HeadSkeleton, PageSkeleton } from "@/components/foothill/skeleton";

/** The dashboard while it loads: heading, then the first two panels' frames. */
export default function Loading() {
  return (
    <PageSkeleton>
      <HeadSkeleton />
      <div className="mt-20 space-y-28 md:mt-24">
        {[260, 560].map((height) => (
          <div key={height}>
            <div className="border-t border-line pt-4">
              <Bar className="h-3 w-32" />
            </div>
            <Bar className="mt-8 w-full" style={{ height: height - 60 }} />
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
