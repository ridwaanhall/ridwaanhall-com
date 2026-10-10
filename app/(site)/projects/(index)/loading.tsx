import { CardsSkeleton, FilterBarSkeleton, HeadSkeleton, PageSkeleton } from "@/components/foothill/skeleton";

/** The work index while it loads: heading, the search and filters, the first cards. */
export default function Loading() {
  return (
    <PageSkeleton>
      <HeadSkeleton facts={4} />
      <section className="wrap" style={{ paddingBottom: 72 }}>
        <FilterBarSkeleton sort={200} view={108} />
        <CardsSkeleton count={6} />
      </section>
    </PageSkeleton>
  );
}
