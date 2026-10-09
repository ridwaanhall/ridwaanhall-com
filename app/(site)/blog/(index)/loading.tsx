import { CardsSkeleton, HeadSkeleton, PageSkeleton, RowSkeleton } from "@/components/foothill/skeleton";

/** Writing while it loads: heading, the three picked posts, the first rows. */
export default function Loading() {
  return (
    <PageSkeleton>
      <HeadSkeleton facts={4} />
      <section className="wrap sec" style={{ borderTop: 0, paddingTop: 0 }}>
        <CardsSkeleton count={3} />
      </section>
      <section className="wrap" style={{ paddingBottom: 72 }}>
        {Array.from({ length: 5 }, (_, i) => (
          <RowSkeleton key={i} />
        ))}
      </section>
    </PageSkeleton>
  );
}
