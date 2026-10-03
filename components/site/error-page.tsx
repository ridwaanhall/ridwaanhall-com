"use client";

import Link from "next/link";

import { RollLabel } from "@/components/motion/interactive";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, ButtonContent } from "@/components/site/ui";
import { useCurrentYear } from "@/lib/utils/use-current-year";

/**
 * The shared error page.
 *
 * `not-found.tsx` and `error.tsx` both render it, and both sit inside the root
 * layout, so the palette, fonts and theme script come from one place.
 *
 * It deliberately renders *outside* the site shell -- no sidebar, no nav. An
 * error page that reproduces the whole chrome invites the reader to keep
 * browsing from a broken state; the link row near the bottom gives them the
 * same destinations without the pretence that the page loaded. It also takes
 * nothing from the database, which matters because the failure this app
 * actually has is a database it cannot reach.
 *
 * **Built out of the site's own parts.** It used to be its own visual world: a
 * red-to-pink gradient behind the status code, a pulsing ring around a warning
 * triangle, `font-bold` and `font-semibold` in a site that uses neither. It
 * reads as a page of this site now -- the heading and lead of any other page,
 * the primary and secondary buttons from `components/site/ui.tsx`, the
 * footer's plain link row -- and the status code is set large in the dimmest
 * neutral, a shape rather than an alarm. What the reader needs to know is what
 * went wrong and where to go, and the title says the first.
 */
export function ErrorPage({
  code = 404,
  title = "Page Not Found",
  message = "Sorry, the page you are looking for doesn't seem to exist or may have been moved.",
  embedded = false,
}: {
  code?: number | string;
  /**
   * Rendered inside the site's own navbar and footer -- a `notFound()` thrown
   * by a public page. The page then drops its full-screen height and its own
   * link row: the chrome around it already carries both, and drawing them
   * twice is what left a 404 inside the site with two copyright lines.
   */
  embedded?: boolean;
  title?: string;
  message?: string;
}) {
  const year = useCurrentYear();

  return (
    <main className="mx-auto w-full max-w-5xl px-5 sm:px-8">
      <div className={embedded ? "py-20 md:py-28" : "flex min-h-screen flex-col justify-center py-16"}>
        <p
          aria-hidden="true"
          className="text-[clamp(4.5rem,3rem+6vw,7.5rem)] leading-[0.9] font-[600] tracking-[-0.06em] text-zinc-800 select-none [font-stretch:125%]"
        >
          {code}
        </p>
        <p className="sr-only">Error {code}</p>

        <h1 className="mt-8 type-title text-zinc-100">{title}</h1>
        <p className="mt-5 max-w-xl type-lead text-zinc-400">{message}</p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/" className={BUTTON_PRIMARY}>
            <ButtonContent label="Homepage" arrow="right" />
          </Link>
          {/* `window.history.back()` rather than the error boundary's `retry`.
              Retrying re-renders the segment, which helps only for a transient
              failure -- offered here it would look like a retry that does
              nothing. */}
          <button type="button" onClick={() => window.history.back()} className={BUTTON_SECONDARY}>
            <ButtonContent label="Go back" fill />
          </button>
        </div>

        {!embedded && (
          <div className="mt-20 flex flex-col gap-3 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
            <nav aria-label="Pages" className="flex flex-wrap gap-x-5 gap-y-1">
              {(
                [
                  ["/", "Home"],
                  ["/about", "About"],
                  ["/projects", "Projects"],
                  ["/blog", "Blog"],
                  ["/contact", "Contact"],
                ] as const
              ).map(([href, label]) => (
                <Link key={href} href={href} className="rounded-full transition-colors hover:text-zinc-100">
                  <RollLabel>{label}</RollLabel>
                </Link>
              ))}
            </nav>
            <p className="type-meta">&copy; 2025 - {year} Ridwan Halim</p>
          </div>
        )}
      </div>
    </main>
  );
}
