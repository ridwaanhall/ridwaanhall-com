import { SkeletonBar } from "@/components/skeleton";
import { cn } from "@/lib/utils/cn";

/**
 * How a page introduces itself.
 *
 * This was copy-pasted onto seven pages, and every copy wrapped its single
 * child in `flex flex-col md:flex-row md:items-center justify-between` -- a row
 * that has nothing to justify against, on all seven. `/guestbook` was the one
 * page that left the wrapper out, and it looked exactly the same, which is the
 * proof. The four different bottom margins the copies had drifted into are one
 * step on the scale now.
 *
 * **The lead is capped at the reading measure and the title is not.** A title
 * is a shape you take in at a glance; a sentence is something you read along,
 * and set across the full 1216px column it runs to about 150 characters, where
 * the eye loses the start of the next line. The cap is why widening the column
 * did not have to make reading worse.
 *
 * `aside` is for what belongs to the page rather than to any one section of it
 * -- a "last updated" date, a count of results. It sits under the lead rather
 * than beside the title, because the thing beside a title on a narrow screen is
 * the thing that wraps into it.
 */
export function PageHeader({
  title,
  lead,
  aside,
  className,
}: {
  title: React.ReactNode;
  lead?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-header", className)}>
      <h1 className="text-page font-medium tracking-tight text-balance">{title}</h1>
      {lead && <p className="mt-3 max-w-measure text-lead text-zinc-300">{lead}</p>}
      {aside && <div className="mt-3 text-meta text-zinc-500">{aside}</div>}
    </header>
  );
}

/**
 * What stands in for it.
 *
 * In the same file as the thing it copies, deliberately: every skeleton on this
 * site used to be a hand-built duplicate of a shape that lived somewhere else,
 * and the only reliable way to keep two shapes in step is to make it impossible
 * to edit one without the other being in the diff.
 */
export function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("mb-header", className)}>
      <SkeletonBar className="h-9 w-64" />
      <SkeletonBar className="mt-3 h-4 w-full max-w-measure" />
      <SkeletonBar className="mt-2 h-4 w-3/5 max-w-md" />
    </div>
  );
}
