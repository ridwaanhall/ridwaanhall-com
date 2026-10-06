import { Bar, HeadSkeleton, PageSkeleton } from "@/components/foothill/skeleton";

/** A legal document while it loads: heading, contents, the first section. */
export function LegalSkeleton() {
  return (
    <PageSkeleton>
      <HeadSkeleton />
      <div className="mt-16 grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="hidden space-y-3 lg:col-span-3 lg:block">
          <Bar className="h-3 w-20" />
          {Array.from({ length: 8 }, (_, i) => (
            <Bar key={i} className="h-4 w-36" />
          ))}
        </div>
        <div className="space-y-3 lg:col-span-8 lg:col-start-5">
          <Bar className="h-7 w-64" />
          {Array.from({ length: 10 }, (_, i) => (
            <Bar key={i} className={i % 3 === 2 ? "h-5 w-[55%]" : "h-5 w-full"} />
          ))}
        </div>
      </div>
    </PageSkeleton>
  );
}
