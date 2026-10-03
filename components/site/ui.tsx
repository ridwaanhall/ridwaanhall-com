import type { Route } from "next";
import Link from "next/link";

import { ArrowFx, LineText, RollLabel } from "@/components/motion/interactive";
import { Reveal, SplitHeading } from "@/components/motion/reveal";
import { ScrambleIn } from "@/components/motion/scramble";
import { cn } from "@/lib/utils/cn";

/**
 * The public site's few building blocks.
 *
 * One column, one neutral ramp, and no boxes: no cards, no hairlines between
 * sections, no outlined panels. What separates one thing from the next is
 * space and type -- a section is a heading with room around it, and the small
 * mono marker above the heading says what the section holds. Everything a page
 * is made of is one of these shapes, so the pages cannot drift into dialects
 * of the same idea.
 *
 * The one place a line survives is a control's edge: a button or a field has
 * to show where it can be pressed or typed into, and those borders are drawn
 * firmly enough to be seen (three to one against the canvas, in both themes).
 *
 * Server-safe on purpose: no hooks, no `"use client"`. Motion is declared by
 * placing the client pieces from `components/motion` inside the markup --
 * `Reveal` and `SplitHeading` for arrival, `RollLabel`, `LineText` and
 * `ArrowFx` for hover.
 */

/** The content column. Every page and the chrome share this edge. */
export const CONTAINER = "mx-auto w-full max-w-5xl px-5 sm:px-8";

/** The narrower measure for running text: articles, legal pages. */
export const PROSE_CONTAINER = "mx-auto w-full max-w-3xl px-5 sm:px-8";

export const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";

/*
 * Every button is a pill. The transition names its properties rather than
 * `all`, because the press is a GSAP scale on this element and a CSS
 * transition on `transform` would drag behind it.
 */
const BUTTON = cn(
  "relative inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full px-5 text-sm font-medium transition-[color,background-color,border-color] duration-500 ease-out disabled:cursor-not-allowed disabled:opacity-50",
  FOCUS,
);

export const BUTTON_PRIMARY = cn(BUTTON, "bg-zinc-100 text-black hover:bg-zinc-300");

/**
 * zinc-500 is the lightest step that clears three to one against the canvas
 * in both themes; the step below it reads as a smudge in light mode.
 *
 * Its hover is the surface, not the words: the fill comes up a step and the
 * edge brightens, and the label stays still. A button with an outline already
 * says "press here" by its shape, so lighting it is the whole of the answer.
 */
export const BUTTON_SECONDARY = cn(
  BUTTON,
  "border border-zinc-500 text-zinc-100 hover:border-zinc-300 hover:bg-zinc-800 active:bg-zinc-700",
);

/** A round icon-only control: search, theme, menu, share, pagination arrows. */
export const ICON_BUTTON = cn(
  "relative inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-400 transition-[color,background-color] duration-500 ease-out hover:bg-zinc-900 hover:text-zinc-100",
  FOCUS,
);

/** A quiet inline link. Wrap its text in `LineText` for the drawn underline. */
export const TEXT_LINK = cn("rounded-full text-zinc-100", FOCUS);

type ArrowDirection = "right" | "left" | "up" | "up-right" | "down";

/**
 * A button that goes somewhere. A filled button's label rolls on hover; an
 * outlined one lights its surface instead; an optional arrow travels.
 */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  arrow,
  leading,
  className,
}: {
  href: Route | string;
  children: string;
  variant?: "primary" | "secondary";
  arrow?: ArrowDirection;
  /** An icon before the label, e.g. a brand mark. */
  leading?: React.ReactNode;
  className?: string;
}) {
  const external = /^(https?:|mailto:)/.test(href);
  const classes = cn(variant === "primary" ? BUTTON_PRIMARY : BUTTON_SECONDARY, className);
  const content = <ButtonContent label={children} outlined={variant === "secondary"} arrow={arrow} leading={leading} />;

  return external ? (
    <a href={href} target={href.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer" className={classes}>
      {content}
    </a>
  ) : (
    <Link href={href as Route} className={classes}>
      {content}
    </Link>
  );
}

/** The inside of any pill button, for the places that render a `<button>`. */
export function ButtonContent({
  label,
  outlined = false,
  arrow,
  leading,
}: {
  label: string;
  /** An outlined button: the label stays still, and the hover is its fill. */
  outlined?: boolean;
  arrow?: ArrowDirection;
  leading?: React.ReactNode;
}) {
  return (
    <>
      {outlined ? (
        <>
          {leading && <span className="inline-flex">{leading}</span>}
          <span>{label}</span>
        </>
      ) : (
        <RollLabel leading={leading} className="relative">
          {label}
        </RollLabel>
      )}
      {arrow &&
        (outlined ? (
          <StillArrow direction={arrow} />
        ) : (
          <ArrowFx direction={arrow} className="relative h-3.5 w-3.5" />
        ))}
    </>
  );
}

/** The arrow an outlined button carries: drawn, but it does not travel. */
function StillArrow({ direction }: { direction: ArrowDirection }) {
  const path: Record<ArrowDirection, string> = {
    right: "M5 12h14M13 6l6 6-6 6",
    left: "M19 12H5M11 6l-6 6 6 6",
    up: "M12 19V5M6 11l6-6 6 6",
    "up-right": "M7 17 17 7M8 7h9v9",
    down: "M12 5v14M6 13l6 6 6-6",
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-3.5 w-3.5"
    >
      <path d={path[direction]} />
    </svg>
  );
}

/**
 * A page's opening: an optional marker, the title split into lines that rise
 * into place, a lead in the reading face, and any trailing content.
 */
export function PageHeader({
  title,
  lead,
  marker,
  children,
  className,
}: {
  title: React.ReactNode;
  lead?: React.ReactNode;
  /** A short fact set in mono above the title: a count, a date, a place. */
  marker?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("pt-12 pb-14 md:pt-24 md:pb-20", className)}>
      {marker && (
        <Reveal className="mb-6">
          <ScrambleIn className="type-meta text-zinc-500">{marker}</ScrambleIn>
        </Reveal>
      )}
      <SplitHeading className="max-w-4xl type-title text-zinc-100">{title}</SplitHeading>
      {lead && (
        <Reveal as="p" className="mt-7 max-w-2xl type-lead text-zinc-400">
          {lead}
        </Reveal>
      )}
      {children}
    </header>
  );
}

/**
 * A section: space above and below, a mono marker, a heading that rises by
 * line, and an optional action level with it. No rule -- the marker and the
 * room around the heading are what say a new section has begun.
 */
export function Section({
  title,
  marker,
  action,
  children,
  id,
  className,
}: {
  title?: React.ReactNode;
  /** What the section holds, as a fact: "4 of 64", "last 7 days". */
  marker?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24 py-14 md:py-20", className)}>
      {(title || action || marker) && (
        <div className="mb-10 flex items-end justify-between gap-6 md:mb-12">
          <div className="min-w-0">
            {marker && (
              <Reveal className="mb-3">
                <ScrambleIn className="type-meta text-zinc-500">{marker}</ScrambleIn>
              </Reveal>
            )}
            {title && (
              <SplitHeading as="h2" className="type-section text-zinc-100">
                {title}
              </SplitHeading>
            )}
          </div>
          {action && <Reveal className="shrink-0 pb-1">{action}</Reveal>}
        </div>
      )}
      {children}
    </section>
  );
}

/** "View all" and its kin: a label that rolls and an arrow that travels. */
export function ArrowLink({
  href,
  children,
  className,
}: {
  href: Route | string;
  children: string;
  className?: string;
}) {
  const external = /^https?:\/\//.test(href);
  const content = (
    <>
      <RollLabel>{children}</RollLabel>
      <ArrowFx direction={external ? "up-right" : "right"} className="h-3.5 w-3.5" />
    </>
  );
  const classes = cn(
    "inline-flex shrink-0 items-center gap-1.5 rounded-full text-sm text-zinc-400 transition-colors duration-500 hover:text-zinc-100",
    FOCUS,
    className,
  );
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
      {content}
    </a>
  ) : (
    <Link href={href as Route} className={classes}>
      {content}
    </Link>
  );
}

/** "All posts", "All projects": the way back from a detail page. */
export function BackLink({ href, children }: { href: Route; children: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full text-sm text-zinc-500 transition-colors duration-500 hover:text-zinc-100",
        FOCUS,
      )}
    >
      <ArrowFx direction="left" className="h-3.5 w-3.5" />
      <RollLabel>{children}</RollLabel>
    </Link>
  );
}

/** Underlined text inside a link, re-exported for server components. */
export { LineText };

export function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function ArrowUpRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

/** A small dot that says "available" without a coloured badge. */
export function StatusDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex h-2 w-2", className)} aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60 motion-reduce:animate-none" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
    </span>
  );
}

/** A dot between inline facts, hidden from assistive technology. */
export function Dot() {
  return (
    <span aria-hidden="true" className="text-zinc-700">
      ·
    </span>
  );
}
