import { Bar, HeadSkeleton, PageSkeleton, ResultsSkeleton } from "@/components/foothill/skeleton";

/** The writing index while it loads: heading, the three to start with, the list. */
export default function Loading() {
  return (
    <PageSkeleton>
      <HeadSkeleton />
      <div className="mt-16 border-t border-line pt-4 md:mt-24">
        <Bar className="h-3 w-32" />
      </div>
      <div className="mt-8 grid gap-10 md:grid-cols-3 md:gap-8">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <Bar className="h-3 w-28" />
            <Bar className="mt-3 h-8 w-full" />
            <Bar className="mt-2 h-8 w-[70%]" />
            <Bar className="mt-3 h-4 w-full" />
            <Bar className="mt-2 h-4 w-[85%]" />
          </div>
        ))}
      </div>
      <div className="mt-20 md:mt-28">
        <ResultsSkeleton rowHeight={117} />
      </div>
    </PageSkeleton>
  );
}
