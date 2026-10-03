import { Bar, CardsSkeleton, GlanceSkeleton, PageSkeleton } from "@/components/foothill/skeleton";

/** The home page while it loads: the name and what is newest, then the work. */
export default function Loading() {
  return (
    <PageSkeleton>
      <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-8">
          <Bar className="h-[clamp(2.6rem,1.2rem+5.6vw,6.1rem)] w-[70%]" />
          <Bar className="mt-1 h-[clamp(2.6rem,1.2rem+5.6vw,6.1rem)] w-[62%]" />
          <Bar className="mt-8 h-6 w-full max-w-[30ch]" />
          <Bar className="mt-2 h-6 w-[70%] max-w-[22ch]" />
          <div className="mt-10 flex gap-3">
            <Bar className="h-12 w-40 rounded-full" />
            <Bar className="h-12 w-36 rounded-full" />
          </div>
        </div>
        <div className="lg:col-span-4 lg:col-start-9">
          <GlanceSkeleton rows={4} />
        </div>
      </div>
      <Bar className="mt-32 h-11 w-56 md:mt-44" />
      <CardsSkeleton className="mt-12" />
    </PageSkeleton>
  );
}
