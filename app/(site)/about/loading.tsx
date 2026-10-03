import { Bar, HeadSkeleton, PageSkeleton } from "@/components/foothill/skeleton";

/** The about page while it loads: the heading, the index, the story. */
export default function Loading() {
  return (
    <PageSkeleton>
      <HeadSkeleton />
      <div className="mt-20 grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="hidden space-y-3 lg:col-span-3 lg:block">
          <Bar className="h-3 w-24" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <Bar key={i} className="h-4 w-32" />
          ))}
        </div>
        <div className="lg:col-span-9">
          <Bar className="h-3 w-16" />
          <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,1fr)_14rem]">
            <div className="space-y-3">
              {Array.from({ length: 12 }, (_, i) => (
                <Bar key={i} className={i % 4 === 3 ? "h-6 w-[60%]" : "h-6 w-full"} />
              ))}
            </div>
            <Bar className="aspect-[4/5] w-40 md:w-full" />
          </div>
        </div>
      </div>
    </PageSkeleton>
  );
}
