import { cn } from "@/lib/utils/cn";

/**
 * A heading inside a page, and optionally the thing that qualifies it.
 *
 * The row this replaces was copy-pasted ten times -- `flex flex-row
 * items-center justify-between` -- and in two of those ten there was nothing on
 * the right-hand side at all, so `justify-between` was justifying a single
 * child against itself. **The wrapper is emitted only when there is an `aside`**,
 * which retires that by construction rather than by anybody remembering.
 *
 * `items-baseline`, not `items-center`. The right-hand slot holds a caption at
 * 12px beside a heading at 20; centred, the two sit on different lines and
 * neither looks deliberate. On their shared baseline they read as one line of
 * type with a quiet half.
 *
 * The copies had drifted into two scales -- one on the home page, a smaller one
 * on the dashboard -- for the same job. There is one.
 */
export function SectionHeading({
  children,
  id,
  aside,
  className,
}: {
  children: React.ReactNode;
  /** Set it where the section is worth linking to. */
  id?: string;
  /** A date, a count, a "View all" -- what qualifies the heading. */
  aside?: React.ReactNode;
  className?: string;
}) {
  const heading = (
    <h2 id={id} className={cn("text-section font-medium", !aside && "mb-stack", className)}>
      {children}
    </h2>
  );

  if (!aside) return heading;

  return (
    <div className={cn("mb-stack flex items-baseline justify-between gap-4")}>
      {heading}
      <div className="shrink-0 text-meta text-zinc-400">{aside}</div>
    </div>
  );
}
