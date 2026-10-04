import { cn } from "@/lib/utils/cn";

/**
 * The admin's skeleton pieces: a bar for a line of text, a heading, a control
 * or a cell, and the screen head every admin screen opens with.
 *
 * The public site draws its own (`components/foothill/skeleton.tsx`), shaped
 * to its frame; the admin's screens are dense enough that one bar, sized at
 * each call to the real thing it stands in for, is all they need. Explicit
 * sizes rather than growing to fit, because the point of a skeleton is that
 * nothing moves when the content lands.
 */
export function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn("rounded bg-zinc-900", className)} />;
}

/**
 * `ScreenHead` while it loads: the title, a lead or a meta line, and the rule
 * under them -- the one shape every admin screen opens with.
 */
export function ScreenHeadSkeleton({ lead = true, meta = false }: { lead?: boolean; meta?: boolean }) {
  return (
    <div className="border-b border-zinc-800 pb-7">
      <SkeletonBar className="h-[clamp(1.9rem,1.5rem+1.4vw,2.6rem)] w-56 max-w-full" />
      {lead && <SkeletonBar className="mt-3 h-[22px] w-96 max-w-full" />}
      {meta && <SkeletonBar className="mt-3 h-[22px] w-64 max-w-full" />}
    </div>
  );
}
