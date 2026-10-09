import { Bar, CardsSkeleton, PageSkeleton } from "@/components/foothill/skeleton";

/** Home while it loads: the name and the role, the ticker, then the work. */
export default function Loading() {
  return (
    <PageSkeleton>
      <section className="wrap hero">
        <div style={{ display: "grid", gap: 16, alignContent: "end" }}>
          <Bar w={220} h={30} />
          <Bar w="72%" h="clamp(48px, 8vw, 84px)" />
          <Bar w="44%" h={24} />
          <Bar w="58%" h={18} />
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <Bar w={150} h={44} r="var(--fh-r-m)" />
            <Bar w={140} h={44} r="var(--fh-r-m)" />
          </div>
        </div>
      </section>
      <div className="wrap">
        <div className="ticker">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i}>
              <Bar w={70} h={12} />
              <Bar w="70%" h={16} />
            </div>
          ))}
        </div>
      </div>
      <section className="wrap sec" style={{ borderTop: 0 }}>
        <CardsSkeleton count={3} />
      </section>
    </PageSkeleton>
  );
}
