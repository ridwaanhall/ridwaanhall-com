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
  return <div className={cn("rounded-[4px] bg-raise", className)} style={style} />;
}

/**
 * A page heading as `PageHead` draws it: two title lines and a lead, and the
 * `Glance` beside them, `aside` ruled rows long.
 */
export function HeadSkeleton({ lead = true, aside }: { lead?: boolean; aside?: number }) {
  const text = (
    <>
      <Bar className="h-[clamp(2.3rem,1.35rem+3.45vw,4.3rem)] w-[85%]" />
      <Bar className="mt-1 h-[clamp(2.3rem,1.35rem+3.45vw,4.3rem)] w-[55%]" />
      {lead && (
        <>
          <Bar className="mt-7 h-5 w-full max-w-[56ch]" />
          <Bar className="mt-2.5 h-5 w-[70%] max-w-[40ch]" />
        </>
      )}
    </>
  );
  if (aside === undefined) return <div className="max-w-[980px]">{text}</div>;
  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-10">
      <div className="lg:col-span-8">{text}</div>
      <div className="lg:col-span-4">
        <GlanceSkeleton rows={aside} />
      </div>
    </div>
  );
}

/** `Glance` while it loads: its ruled rows. */
export function GlanceSkeleton({ rows }: { rows: number }) {
  return (
    <div className="border-t border-line">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center justify-between gap-6 border-b border-line py-3">
          <Bar className="h-[18px] w-20" />
          <Bar className="h-[18px] w-28" />
        </div>
      ))}
    </div>
  );
}

/** Cards as `CardGrid` lays out its first rows: a wide one, then a narrow one. */
export function CardsSkeleton({ count = 2, className }: { count?: number; className?: string }) {
  const spans = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-5", "lg:col-span-7"];
  const ratios = ["lg:aspect-[7/5]", "lg:aspect-square", "lg:aspect-square", "lg:aspect-[7/5]"];
  return (
    <div className={cn("grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-x-8", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={spans[i % 4]}>
          <Bar className={cn("aspect-[4/3] w-full rounded-[16px]", ratios[i % 4])} />
          <Bar className="mt-5 h-7 w-[70%]" />
          <Bar className="mt-3 h-4 w-[90%]" />
        </div>
      ))}
    </div>
  );
}

/**
 * A listing's results while `searchParams` is read: the search line and the
 * first cards. Here rather than beside the results so a route's
 * `loading.tsx` can draw it without importing the client grid.
 */
export function ResultsSkeleton() {
  return (
    <div role="status" aria-busy="true" className="skeleton-pulse">
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true">
        <Bar className="h-12 w-full" />
        <CardsSkeleton count={4} className="mt-14" />
      </div>
    </div>
  );
}
