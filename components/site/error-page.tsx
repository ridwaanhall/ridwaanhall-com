"use client";

import Link from "next/link";

import { BUTTON_PRIMARY, BUTTON_SECONDARY } from "@/components/site/ui";
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
}: {
  code?: number | string;
  title?: string;
  message?: string;
}) {
  const year = useCurrentYear();

  return (
    <main className="mx-auto w-full max-w-5xl px-5 sm:px-8">
      <div className="flex min-h-screen flex-col justify-center py-16">
        <p aria-hidden="true" className="text-[7rem] leading-none font-medium tracking-tighter text-zinc-800 select-none sm:text-[10rem]">
          {code}
        </p>
        <p className="sr-only">Error {code}</p>

        <h1 className="mt-6 text-4xl font-medium tracking-tight text-zinc-100 sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-zinc-400">{message}</p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/" className={BUTTON_PRIMARY}>
            Homepage
          </Link>
          {/* `window.history.back()` rather than the error boundary's `retry`.
              Retrying re-renders the segment, which helps only for a transient
              failure -- offered here it would look like a retry that does
              nothing. */}
          <button type="button" onClick={() => window.history.back()} className={`${BUTTON_SECONDARY} cursor-pointer`}>
            Go back
          </button>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-zinc-800 pt-6 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
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
              <Link key={href} href={href} className="transition-colors hover:text-zinc-100">
                {label}
              </Link>
            ))}
          </nav>
          <p className="text-xs">&copy; 2025 - {year} Ridwan Halim</p>
        </div>
      </div>
    </main>
  );
}
