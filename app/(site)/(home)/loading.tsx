import { Bar, CardsSkeleton, PageSkeleton } from "@/components/foothill/skeleton";

/** The home page while it loads: the name and the portrait, then the work. */
export default function Loading() {
  return (
    <PageSkeleton>
      <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <Bar className="h-[clamp(3.1rem,1.2rem+8.3vw,8.6rem)] w-[70%]" />
          <Bar className="mt-3 h-[clamp(3.1rem,1.2rem+8.3vw,8.6rem)] w-[62%]" />
          <Bar className="mt-8 h-7 w-full max-w-[30ch]" />
          <Bar className="mt-2 h-7 w-[70%] max-w-[22ch]" />
          <div className="mt-10 flex gap-3">
            <Bar className="h-12 w-40 rounded-full" />
            <Bar className="h-12 w-36 rounded-full" />
          </div>
        </div>
        <Bar className="mx-auto aspect-square w-full max-w-[420px] rounded-[18px] lg:col-span-5 lg:max-w-none" />
      </div>
      <Bar className="mt-32 h-14 w-64 md:mt-44" />
      <CardsSkeleton className="mt-12" />
    </PageSkeleton>
  );
}
