import { cn } from "@/lib/utils/cn";

/**
 * The admin's skeleton bar: a line of text, a heading, a control, a cell.
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
