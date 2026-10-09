import { Bar, HeadSkeleton, PageSkeleton, RowSkeleton } from "@/components/foothill/skeleton";

/** About while it loads: the heading and facts, the contents, the first rows. */
export default function Loading() {
  return (
    <PageSkeleton>
      <HeadSkeleton facts={5} />
      <div className="wrap about" style={{ paddingBottom: 72 }}>
        <div className="toc" style={{ display: "grid", gap: 10, alignContent: "start", padding: "12px 0" }}>
          {Array.from({ length: 8 }, (_, i) => (
            <Bar key={i} w={i % 2 ? "60%" : "75%"} />
          ))}
        </div>
        <div>
          {Array.from({ length: 5 }, (_, i) => (
            <RowSkeleton key={i} avatar />
          ))}
        </div>
      </div>
    </PageSkeleton>
  );
}
