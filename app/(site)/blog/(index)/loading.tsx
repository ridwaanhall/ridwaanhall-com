import { Bar, HeadSkeleton, PageSkeleton, ResultsSkeleton } from "@/components/foothill/skeleton";

/** The writing index while it loads: heading, the post to start with, the rest. */
export default function Loading() {
  return (
    <PageSkeleton>
      <HeadSkeleton aside={3} />
      <div className="mt-16 grid items-end gap-8 md:mt-24 lg:grid-cols-12 lg:gap-10">
        <Bar className="aspect-[16/10] w-full rounded-[18px] lg:col-span-7" />
        <div className="lg:col-span-5">
          <Bar className="h-4 w-48" />
          <Bar className="mt-4 h-10 w-full" />
          <Bar className="mt-2 h-10 w-[70%]" />
          <Bar className="mt-5 h-4 w-full" />
          <Bar className="mt-2 h-4 w-[85%]" />
        </div>
      </div>
      <div className="mt-24 md:mt-32">
        <ResultsSkeleton />
      </div>
    </PageSkeleton>
  );
}
