import { HeadSkeleton, PageSkeleton, ResultsSkeleton } from "@/components/foothill/skeleton";

/** The work index while it loads: heading, search, the first cards. */
export default function Loading() {
  return (
    <PageSkeleton>
      <HeadSkeleton />
      <div className="mt-16 md:mt-24">
        <ResultsSkeleton />
      </div>
    </PageSkeleton>
  );
}
