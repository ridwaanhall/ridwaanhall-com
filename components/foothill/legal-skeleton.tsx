import { Bar, HeadSkeleton, LinesSkeleton, PageSkeleton } from "@/components/foothill/skeleton";

/** A legal document while it loads: heading and facts, contents, the first section. */
export function LegalSkeleton() {
  return (
    <PageSkeleton>
      <HeadSkeleton facts={3} />
      <div className="wrap about" style={{ paddingBottom: 72 }}>
        <div className="toc" style={{ display: "grid", gap: 10, alignContent: "start", padding: "12px 0" }}>
          {Array.from({ length: 7 }, (_, i) => (
            <Bar key={i} w={i % 2 ? "60%" : "75%"} />
          ))}
        </div>
        <div style={{ display: "grid", gap: 18 }}>
          <Bar w={260} h={28} />
          <LinesSkeleton count={10} />
        </div>
      </div>
    </PageSkeleton>
  );
}
