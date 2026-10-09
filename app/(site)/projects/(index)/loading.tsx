import { Bar, CardsSkeleton, HeadSkeleton, PageSkeleton } from "@/components/foothill/skeleton";

/** The work index while it loads: heading, the search and filters, the first cards. */
export default function Loading() {
  return (
    <PageSkeleton>
      <HeadSkeleton facts={4} />
      <section className="wrap" style={{ paddingBottom: 72 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
          <Bar w={320} h={42} r="var(--fh-r-m)" />
          <Bar w={70} h={32} r="var(--fh-r-m)" />
          <Bar w={90} h={32} r="var(--fh-r-m)" />
        </div>
        <CardsSkeleton count={6} />
      </section>
    </PageSkeleton>
  );
}
