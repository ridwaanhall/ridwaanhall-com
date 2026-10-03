import type { Route } from "next";
import Link from "next/link";

import { EYEBROW } from "@/components/foothill/classes";
import { statusDot } from "@/lib/site/status-colors";
import { cn } from "@/lib/utils/cn";

/**
 * The opening of a section: a hairline, a mono label, and what the section
 * holds counted beside it, with an optional link to the rest.
 *
 * The count is the point of the label rather than ornament -- "Writing 20"
 * tells a reader how much is behind the five shown.
 */
export function SectionHead({
  label,
  count,
  href,
  linkLabel,
  id,
  className,
}: {
  label: string;
  count?: number;
  href?: Route;
  linkLabel?: string;
  id?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-6 border-t border-line pt-4", className)}>
      <h2 id={id} className={EYEBROW}>
        {label}
        {count !== undefined && <span className="ml-2 text-ink tabular-nums">{count}</span>}
      </h2>
      {href && linkLabel && (
        <Link href={href} className="group text-[14px] text-mute transition-colors hover:text-ink">
          {linkLabel}
          <Arrow className="ml-1.5" />
        </Link>
      )}
    </div>
  );
}

/** A right arrow that leans forward when its link is hovered (`group`). */
export function Arrow({ className, diagonal = false }: { className?: string; diagonal?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block transition-transform duration-300",
        diagonal
          ? "group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          : "group-hover:translate-x-1",
        className,
      )}
    >
      {diagonal ? "↗" : "→"}
    </span>
  );
}

/** A project status: a coloured dot and its label. */
export function StatusDot({
  label,
  color,
  className,
}: {
  label: string;
  color: string;
  className?: string;
}) {
  if (!label) return null;
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden="true"
        className="h-[7px] w-[7px] shrink-0 rounded-full"
        style={{ backgroundColor: statusDot(color) }}
      />
      {label}
    </span>
  );
}

/** A page's heading block: an eyebrow, a large title, and a lead line. */
export function PageHead({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="max-w-[880px]">
      <p data-fh-enter className={EYEBROW}>
        {eyebrow}
      </p>
      <h1
        data-fh-split
        className="mt-5 text-[clamp(2.5rem,1.6rem+4vw,4.75rem)] leading-[1.02] font-medium tracking-[-0.035em] text-ink"
      >
        {title}
      </h1>
      {lead && (
        <p data-fh-enter className="fh-serif mt-6 max-w-[60ch] text-[clamp(1.125rem,1rem+0.5vw,1.375rem)] leading-[1.5] text-mute">
          {lead}
        </p>
      )}
      {children}
    </header>
  );
}

/** A mono key and its value, for the ruled fact lists on detail pages. */
export function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line py-3 text-[15px]">
      <dt className="fh-mono shrink-0 text-[11px] tracking-[0.14em] text-mute uppercase">{label}</dt>
      <dd className="text-right text-ink">{children}</dd>
    </div>
  );
}
