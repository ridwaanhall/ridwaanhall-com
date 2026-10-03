import { Bar, PageSkeleton, RowsSkeleton } from "@/components/foothill/skeleton";

/** The home page while it loads: the hero's text column, then the work index. */
export default function Loading() {
  return (
    <PageSkeleton>
      <div className="max-w-[560px] lg:pt-10">
        <Bar className="h-3 w-64" />
        <Bar className="mt-6 h-[clamp(3rem,1.9rem+6vw,6.9rem)] w-[80%]" />
        <Bar className="mt-3 h-[clamp(3rem,1.9rem+6vw,6.9rem)] w-[62%]" />
        <Bar className="mt-8 h-5 w-72" />
        <Bar className="mt-4 h-6 w-full max-w-[34ch]" />
        <Bar className="mt-2 h-6 w-[70%] max-w-[26ch]" />
        <Bar className="mt-8 h-4 w-full max-w-md" />
        <div className="mt-10 flex gap-3">
          <Bar className="h-11 w-36 rounded-full" />
          <Bar className="h-11 w-32 rounded-full" />
        </div>
      </div>
      <div className="mt-28 border-t border-line pt-4 md:mt-40">
        <Bar className="h-3 w-32" />
      </div>
      <RowsSkeleton count={4} height={81} className="mt-2" />
    </PageSkeleton>
  );
}
