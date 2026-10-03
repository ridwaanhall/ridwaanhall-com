import { MAIN, WRAP } from "@/components/foothill/layout";
import { cn } from "@/lib/utils/cn";

/**
 * The public site's loading furniture.
 *
 * Its own rather than the shared primitives in `components/skeleton.tsx`,
 * which the admin draws in its own palette. The contract is the same one
 * `scripts/check-page-loading.mjs` and `check-skeleton-shape.mjs` hold every
 * skeleton to: a `role="status"` box whose text starts with "Loading", the
 * `skeleton-pulse` class, an `aria-hidden` inner box, and no `<main>` --
 * with `MAIN` and `WRAP` shared with the page so the two start in the same
 * place.
 */
export function PageSkeleton({ children, bleed = false }: { children: React.ReactNode; bleed?: boolean }) {
  return (
    <div role="status" aria-busy="true" className={cn("skeleton-pulse", MAIN)}>
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true" className={bleed ? undefined : WRAP}>
        {children}
      </div>
    </div>
  );
}

/** One grey shape. */
export function Bar({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("rounded-[3px] bg-raise", className)} style={style} />;
}

/** A page heading as the shared `PageHead` draws it: eyebrow, two title lines, a lead. */
export function HeadSkeleton({ lead = true }: { lead?: boolean }) {
  return (
    <div className="max-w-[880px]">
      <Bar className="h-3 w-24" />
      <Bar className="mt-6 h-[clamp(2.25rem,1.5rem+3.5vw,4.25rem)] w-[85%]" />
      <Bar className="mt-3 h-[clamp(2.25rem,1.5rem+3.5vw,4.25rem)] w-[55%]" />
      {lead && (
        <>
          <Bar className="mt-7 h-5 w-full max-w-[60ch]" />
          <Bar className="mt-2.5 h-5 w-[70%] max-w-[44ch]" />
        </>
      )}
    </div>
  );
}

/** Ruled list rows of a fixed height, for the index lists. */
export function RowsSkeleton({ count, height, className }: { count: number; height: number; className?: string }) {
  return (
    <div className={cn("border-b border-line", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-6 border-t border-line" style={{ height }}>
          <Bar className="h-5 w-[45%]" />
          <Bar className="ml-auto h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

/**
 * A listing's results while `searchParams` is read: the search line, the
 * count, ten rows. Here rather than beside the results so a route's
 * `loading.tsx` can draw it without importing the client list.
 */
export function ResultsSkeleton({ rowHeight }: { rowHeight: number }) {
  return (
    <div role="status" aria-busy="true" className="skeleton-pulse">
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true">
        <Bar className="h-12 w-full" />
        <Bar className="mt-6 h-3 w-40" />
        <RowsSkeleton count={10} height={rowHeight} className="mt-4" />
      </div>
    </div>
  );
}
