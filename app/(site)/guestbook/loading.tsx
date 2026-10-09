import { Bar, HeadSkeleton, PageSkeleton, RowSkeleton } from "@/components/foothill/skeleton";

/** The guestbook while it loads: the heading, the composer beside the thread. */
export default function Loading() {
  return (
    <PageSkeleton>
      <HeadSkeleton facts={4} />
      <div className="wrap gbwrap gb" style={{ paddingBottom: 72 }}>
        <div className="compose">
          <Bar w="60%" h={20} />
          <Bar w="100%" h={200} r="var(--fh-r-m)" />
          <Bar w="100%" h={48} r="var(--fh-r-m)" />
          <Bar w="100%" h={48} r="var(--fh-r-m)" />
        </div>
        <div>
          {Array.from({ length: 6 }, (_, i) => (
            <RowSkeleton key={i} avatar />
          ))}
        </div>
      </div>
    </PageSkeleton>
  );
}
