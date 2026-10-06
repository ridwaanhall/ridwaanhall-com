import { Bar, CardsSkeleton, GlanceSkeleton, PageSkeleton } from "@/components/foothill/skeleton";

/** The home page while it loads: the name and what is newest, then the work. */
export default function Loading() {
  return (
    <PageSkeleton>
      <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-8">
          <Bar className="h-[clamp(2.3rem,1.35rem+3.45vw,4.3rem)] w-[75%] max-w-[16ch]" />
          <Bar className="mt-7 h-7 w-[80%] max-w-[30ch]" />
          <Bar className="mt-3 h-5 w-full max-w-[46ch]" />
          <Bar className="mt-2 h-5 w-[60%] max-w-[30ch]" />
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
