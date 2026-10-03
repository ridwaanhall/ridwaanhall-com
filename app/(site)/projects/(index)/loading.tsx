import { HeadSkeleton, PageSkeleton, ResultsSkeleton } from "@/components/foothill/skeleton";

/** The work index while it loads: heading, search, ten rows. */
export default function Loading() {
  return (
    <PageSkeleton>
      <HeadSkeleton />
      <div className="mt-16 md:mt-20">
        <ResultsSkeleton rowHeight={81} />
      </div>
    </PageSkeleton>
  );
}
