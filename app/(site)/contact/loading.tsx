import { Bar, HeadSkeleton, PageSkeleton } from "@/components/foothill/skeleton";

/** The contact page while it loads: heading, the form, the ways in beside it. */
export default function Loading() {
  return (
    <PageSkeleton>
      <HeadSkeleton aside={3} />
      <div className="mt-16 grid gap-16 md:mt-24 lg:grid-cols-12 lg:gap-10">
        <div className="space-y-8 lg:col-span-7">
          <div className="grid gap-8 md:grid-cols-2">
            <Bar className="h-[66px]" />
            <Bar className="h-[66px]" />
          </div>
          <Bar className="h-[170px]" />
          <Bar className="h-[65px] w-[300px]" />
          <Bar className="h-11 w-40 rounded-full" />
        </div>
        <div className="space-y-4 lg:col-span-4 lg:col-start-9">
          <Bar className="h-3 w-32" />
          <Bar className="h-7 w-56" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Bar key={i} className="mt-4 h-5 w-full" />
          ))}
        </div>
      </div>
    </PageSkeleton>
  );
}
