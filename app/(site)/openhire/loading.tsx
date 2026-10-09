import { Bar, HeadSkeleton, PageSkeleton } from "@/components/foothill/skeleton";

/** Open-hire while it loads: the heading and status, then three columns of lists. */
export default function Loading() {
  return (
    <PageSkeleton>
      <HeadSkeleton facts={4} />
      <section className="wrap" style={{ paddingBottom: 72 }}>
        <Bar w={340} h={36} />
        <div className="pgrid three" style={{ gap: 32, marginTop: 32 }}>
          {Array.from({ length: 3 }, (_, column) => (
            <div key={column} style={{ display: "grid", gap: 12, alignContent: "start" }}>
              {Array.from({ length: 6 }, (_, i) => (
                <Bar key={i} w={i % 3 === 0 ? "40%" : "85%"} />
              ))}
            </div>
          ))}
        </div>
      </section>
    </PageSkeleton>
  );
}
