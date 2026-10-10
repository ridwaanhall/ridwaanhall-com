import { Bar, PageSkeleton } from "@/components/foothill/skeleton";

/** Sign in while it loads: the card and its two buttons. */
export default function Loading() {
  return (
    <PageSkeleton>
      <section className="wrap sign-in">
        <div className="panel sign-card">
          <Bar w="40%" h={36} />
          <Bar w="90%" h={16} />
          <Bar w="100%" h={34} r="var(--fh-r-m)" />
          <Bar w="100%" h={34} r="var(--fh-r-m)" />
        </div>
      </section>
    </PageSkeleton>
  );
}
