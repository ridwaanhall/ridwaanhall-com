import { Bar, HeadSkeleton, LinesSkeleton, PageSkeleton } from "@/components/foothill/skeleton";

/** A project while it loads: the heading and facts, the gallery, the write-up. */
export default function Loading() {
  return (
    <PageSkeleton>
      <HeadSkeleton facts={4} />
      <section className="wrap" style={{ paddingBottom: 72 }}>
        <Bar w="100%" h="auto" r="var(--fh-r-img)" style={{ aspectRatio: "16 / 9", marginBottom: 40 }} />
        <LinesSkeleton count={6} />
      </section>
    </PageSkeleton>
  );
}
