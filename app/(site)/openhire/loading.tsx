import { Bar, HeadSkeleton, PageSkeleton } from "@/components/foothill/skeleton";

/** Open-hire while it loads: heading, then the roles list beside its facts. */
export default function Loading() {
  return (
    <PageSkeleton>
      <HeadSkeleton />
      <div className="mt-24 border-t border-line pt-4 md:mt-32">
        <Bar className="h-3 w-28" />
      </div>
      <div className="mt-10 grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="space-y-4 lg:col-span-7">
          <Bar className="h-4 w-64" />
          {[0, 1, 2, 3].map((i) => (
            <Bar key={i} className="mt-6 h-9 w-[80%]" />
          ))}
        </div>
        <div className="space-y-5 lg:col-span-4 lg:col-start-9">
          {Array.from({ length: 9 }, (_, i) => (
            <Bar key={i} className="h-5 w-full" />
          ))}
        </div>
      </div>
    </PageSkeleton>
  );
}
