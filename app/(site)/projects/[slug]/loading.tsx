import { Bar, PageSkeleton } from "@/components/foothill/skeleton";

/** A project while it loads: the heading, its actions, the image strip. */
export default function Loading() {
  return (
    <PageSkeleton>
      <div className="max-w-[920px]">
        <Bar className="h-3 w-40" />
        <Bar className="mt-8 h-[clamp(2.4rem,1.5rem+3.8vw,4.5rem)] w-[75%]" />
        <Bar className="mt-6 h-6 w-full max-w-[54ch]" />
        <Bar className="mt-2 h-6 w-[60%] max-w-[40ch]" />
        <div className="mt-9 flex gap-3">
          <Bar className="h-11 w-28 rounded-full" />
          <Bar className="h-11 w-28 rounded-full" />
        </div>
      </div>
      <div className="mt-14 flex gap-3 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <Bar key={i} className="aspect-[16/10] w-[78vw] shrink-0 sm:w-[420px]" />
        ))}
      </div>
    </PageSkeleton>
  );
}
