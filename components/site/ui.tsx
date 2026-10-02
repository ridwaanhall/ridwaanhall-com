import type { Route } from "next";
import { Reveal, SplitHeading } from "@/components/motion/reveal";
import Link from "next/link";

import { cn } from "@/lib/utils/cn";

/**
 * The public site's few building blocks.
 *
 * The redesign is one column, one neutral ramp and hairlines: no card grids,
 * no tinted panels, no shadows. Everything a page is made of is one of these
 * four shapes -- a page header, a ruled section, a row in a list, a button --
 * so the pages cannot drift into four dialects of the same idea.
 *
 * Server-safe on purpose: no hooks, no `"use client"`. Motion is declared with
 * `Reveal` and `SplitHeading` from `components/motion/reveal`, which are
 * client components that server components can render around their content.
 */

/** The content column. Every page and the chrome share this edge. */
export const CONTAINER = "mx-auto w-full max-w-5xl px-5 sm:px-8";

/** The narrower measure for running text: articles, legal pages. */
export const PROSE_CONTAINER = "mx-auto w-full max-w-3xl px-5 sm:px-8";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";

export const BUTTON_PRIMARY = cn(
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 text-sm font-medium text-black transition-colors hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-50",
  FOCUS,
);

export const BUTTON_SECONDARY = cn(
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50",
  FOCUS,
);

/** A quiet inline link: muted until hovered, underline drawn from the left. */
export const TEXT_LINK = cn("link-draw rounded-sm text-zinc-100", FOCUS);

/**
 * A page's opening: the title, split into lines that rise into place, and an
 * optional lead and trailing content (actions, meta).
 */
export function PageHeader({
  title,
  lead,
  children,
  className,
}: {
  title: React.ReactNode;
  lead?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("pt-10 pb-12 md:pt-20 md:pb-16", className)}>
      <SplitHeading className="max-w-4xl text-4xl font-medium leading-[1.05] tracking-tight text-balance text-zinc-100 sm:text-5xl md:text-6xl">
        {title}
      </SplitHeading>
      {lead && (
        <Reveal as="p" className="mt-6 max-w-2xl text-base leading-relaxed text-pretty text-zinc-400 sm:text-lg">
          {lead}
        </Reveal>
      )}
      {children}
    </header>
  );
}

/** A ruled section with a heading and an optional link on the same line. */
export function Section({
  title,
  action,
  children,
  id,
  className,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24 border-t border-zinc-800 py-12 md:py-16", className)}>
      {(title || action) && (
        <Reveal className="mb-8 flex items-baseline justify-between gap-4 md:mb-10">
          {title && (
            <h2 className="text-xl font-medium tracking-tight text-zinc-100 sm:text-2xl">{title}</h2>
          )}
          {action}
        </Reveal>
      )}
      {children}
    </section>
  );
}

/** "View all" and its kin: a short label with an arrow that nudges on hover. */
export function ArrowLink({
  href,
  children,
  className,
}: {
  href: Route | string;
  children: React.ReactNode;
  className?: string;
}) {
  const external = /^https?:\/\//.test(href);
  const content = (
    <>
      <span className="link-draw">{children}</span>
      <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
    </>
  );
  const classes = cn(
    "group inline-flex shrink-0 items-center gap-1.5 rounded-sm text-sm text-zinc-400 transition-colors hover:text-zinc-100",
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

/** "All posts", "All projects": the way back from a detail page. */
export function BackLink({ href, children }: { href: Route; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-sm text-sm text-zinc-500 transition-colors hover:text-zinc-100",
        FOCUS,
      )}
    >
      <ArrowRightIcon className="h-3.5 w-3.5 rotate-180 transition-transform duration-300 group-hover:-translate-x-0.5" />
      {children}
    </Link>
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
