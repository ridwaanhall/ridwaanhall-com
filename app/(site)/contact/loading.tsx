import { Bar, HeadSkeleton, PageSkeleton } from "@/components/foothill/skeleton";

/** Contact while it loads: the heading, the ways to reach me, the form. */
export default function Loading() {
  return (
    <PageSkeleton>
      <HeadSkeleton facts={3} />
      <div className="wrap gbwrap contact" style={{ paddingBottom: 72 }}>
        <div className="contact-main" style={{ display: "grid", gap: 18 }}>
          <div className="contact-pair">
            <Bar h={48} r="var(--fh-r-m)" />
            <Bar h={48} r="var(--fh-r-m)" />
          </div>
          <Bar h={160} r="var(--fh-r-m)" />
          <Bar w={170} h={44} r="var(--fh-r-m)" />
        </div>
        <div className="contact-side">
          <Bar w="70%" h={24} />
          <Bar w="100%" h={180} r="var(--fh-r-m)" />
        </div>
      </div>
    </PageSkeleton>
  );
}
