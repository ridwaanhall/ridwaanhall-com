import { cn } from "@/lib/utils/cn";

/**
 * The public site's loading furniture: the same frame as the page, in grey
 * blocks with a soft shimmer, so nothing jumps when the content lands.
 *
 * Its own rather than the admin's in `components/skeleton.tsx`, because it is
 * shaped to the site's frame. The contract is the one
 * `scripts/check-page-loading.mjs` and `check-skeleton-shape.mjs` hold every
 * skeleton to: a `role="status"` box whose text starts with "Loading", the
 * `skeleton-pulse` class, an `aria-hidden` inner box, and no `<main>`. The
 * shimmer is on each block (`.skb` in styles/site.css) and stops for reduced
 * motion.
 */
export function PageSkeleton({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" className={cn("skeleton-pulse skeleton", className)}>
      <span className="sr">Loading the page</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

/** One grey shape. */
export function Bar({
  w = "100%",
  h = 14,
  r,
  style,
}: {
  w?: number | string;
  h?: number | string;
  r?: string;
  style?: React.CSSProperties;
}) {
  return <span className="skb" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

/** A page heading as `PageHead` draws it: two title lines, a lead, and the facts. */
export function HeadSkeleton({ facts = 4, lines = 2 }: { facts?: number; lines?: number }) {
  return (
    <section className="head wrap">
      <div style={{ display: "grid", gap: 12 }}>
        <Bar w="80%" h="clamp(40px, 6vw, 72px)" />
        <Bar w="52%" h="clamp(40px, 6vw, 72px)" />
        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          {Array.from({ length: lines }, (_, i) => (
            <Bar key={i} w={i === lines - 1 ? "58%" : "90%"} h={16} />
          ))}
        </div>
      </div>
      {facts > 0 && (
        <div className="facts">
          {Array.from({ length: facts }, (_, i) => (
            <div key={i}>
              <Bar w="38%" />
              <Bar w="20%" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** A project or post card: the picture, the title, two lines and the meta row. */
export function CardSkeleton() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Bar w="100%" h="auto" r="var(--fh-r-img)" style={{ aspectRatio: "16 / 10" }} />
      <Bar w="70%" h={20} />
      <Bar w="95%" />
      <Bar w="60%" />
      <div style={{ display: "flex", gap: 10 }}>
        <Bar w={78} h={22} />
        <Bar w={60} />
        <Bar w={36} />
      </div>
    </div>
  );
}

export function CardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="pgrid three">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/** A ruled row, with an avatar when it is somebody's message. */
export function RowSkeleton({ avatar }: { avatar?: boolean }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: avatar ? "36px minmax(0,1fr)" : "minmax(0,1fr)",
        gap: 12,
        padding: "16px 0",
        borderBottom: "1px solid var(--fh-line)",
      }}
    >
      {avatar && <Bar w={36} h={36} r="50%" />}
      <div style={{ display: "grid", gap: 8 }}>
        <Bar w="40%" />
        <Bar w="85%" />
      </div>
    </div>
  );
}

/** A dashboard panel: its titled bar and a block for the chart. */
export function PanelSkeleton({ h }: { h: number }) {
  return (
    <div className="panel">
      <div className="panel-h">
        <Bar w={180} h={18} />
      </div>
      <div className="panel-b">
        <Bar w="100%" h={h} />
      </div>
    </div>
  );
}

/** Running text: full lines with every fourth one short. */
export function LinesSkeleton({ count }: { count: number }) {
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: "70ch" }}>
      {Array.from({ length: count }, (_, i) => (
        <Bar key={i} w={i % 4 === 3 ? "64%" : "100%"} />
      ))}
    </div>
  );
}

/**
 * A streaming panel's own fallback, inside a page: the same contract as a
 * page's skeleton, at the size of the panel it stands in for.
 */
export function InlineSkeleton({ children, label = "Loading" }: { children: React.ReactNode; label?: string }) {
  return (
    <div role="status" aria-busy="true" className="skeleton-pulse">
      <span className="sr">{label}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}
