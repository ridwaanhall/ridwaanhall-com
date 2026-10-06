"use client";

import Link from "next/link";

import { LINE_BUTTON, SOLID_BUTTON } from "@/components/foothill/classes";
import { Icon } from "@/components/foothill/icons";
import { Mark } from "@/components/foothill/mark";
import { PageMotion, Roll } from "@/components/foothill/motion";

/**
 * The page shown when there is no page: a 404, or an error boundary.
 *
 * It renders outside every layout but the root one -- the admin's missing
 * routes land here too -- so it carries its own frame and says nothing that
 * is only true of the public site.
 */
export function ErrorPage({
  code = 404,
  title = "This trail ends here.",
  message = "Page not found. The address may be mistyped, or the page has moved somewhere else.",
}: {
  code?: number | string;
  title?: string;
  message?: string;
}) {
  return (
    <div className="fh-site fh-error flex min-h-dvh flex-col bg-paper px-4 text-ink md:px-8">
      <header className="fh-error-chrome mx-auto flex h-16 w-full max-w-[1200px] items-center">
        <Link href="/" className="flex items-center gap-2.5 font-display text-[18px] font-semibold tracking-[-0.025em]">
          <Mark className="h-4 w-7" />
          <span>ridwaanhall</span>
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col justify-center py-20">
        <p
          data-fh-enter
          aria-hidden="true"
          className="font-display text-[clamp(4.5rem,3rem+7vw,8rem)] leading-[0.8] font-semibold tracking-[-0.06em] text-line"
        >
          {code}
        </p>
        <h1
          data-fh-split
          className="mt-8 max-w-[16ch] font-display text-[clamp(2.2rem,1.5rem+3vw,4rem)] leading-[1] font-medium tracking-[-0.04em]"
        >
          {title}
        </h1>
        <p className="mt-6 max-w-[48ch] text-[clamp(1.125rem,1rem+0.5vw,1.375rem)] leading-[1.5] text-mute">
          <span className="sr-only">Error {code}. </span>
          {message}
        </p>
        <div data-fh-enter className="mt-10 flex flex-wrap gap-3">
          <Link href="/" className={SOLID_BUTTON}>
            <Roll>Back to the start</Roll>
            <Icon name="arrow-right" className="transition-transform duration-500 group-hover:translate-x-1" />
          </Link>
          {/* `window.history.back()` rather than the error boundary's `retry`.
              Retrying re-renders the segment, which helps only for a transient
              failure -- offered here it would look like a retry that does
              nothing. */}
          <button type="button" onClick={() => window.history.back()} className={LINE_BUTTON}>
            <Icon name="arrow-left" className="transition-transform duration-500 group-hover:-translate-x-1" />
            <Roll>Go back</Roll>
          </button>
        </div>
        <PageMotion />
      </main>
    </div>
  );
}
