import { Bar, HeadSkeleton, LinesSkeleton, PageSkeleton } from "@/components/foothill/skeleton";

/** A post while it loads: the heading and facts, the cover, the first lines. */
export default function Loading() {
  return (
    <PageSkeleton>
      <HeadSkeleton facts={4} />
      <section className="wrap" style={{ paddingBottom: 72, display: "grid", justifyItems: "center", gap: 40 }}>
        <Bar w="100%" h="auto" r="var(--fh-r-img)" style={{ aspectRatio: "16 / 8" }} />
        <LinesSkeleton count={10} />
      </section>
    </PageSkeleton>
  );
}
