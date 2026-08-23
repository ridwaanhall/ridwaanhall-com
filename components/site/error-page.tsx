"use client";

import Link from "next/link";

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
 * reads as a page of this site now -- the heading and description of any other
 * page, the home hero's `action-btn` pair, the sidebar footer's bulleted link
 * row -- and the status code is a quiet chip rather than the loudest thing on
 * screen. What the reader needs to know is what went wrong and where to go,
 * and the title says the first.
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
    <main className="px-3 py-4 sm:px-4 md:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center py-12">
        <span className="pill-badge self-start border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400">
          Error {code}
        </span>

        <h1 className="mt-3 text-2xl lg:text-3xl font-medium tracking-tight">{title}</h1>
        <p className="mt-2 text-base sm:text-lg leading-relaxed text-zinc-300">{message}</p>

        <div className="mt-6 flex flex-row justify-start gap-2 sm:gap-3">
          <Link href="/" className="action-btn group bg-indigo-800 hover:bg-indigo-700">
            <HomeIcon />
            Homepage
          </Link>
          {/* `window.history.back()` rather than the error boundary's `reset`.
              Reset re-renders the segment, which helps only for a transient
              failure -- offered here it would look like a retry that does
              nothing. */}
          <button
            type="button"
            onClick={() => window.history.back()}
            className="action-btn group cursor-pointer bg-zinc-800 hover:bg-zinc-700"
          >
            <BackIcon />
            Go back
          </button>
        </div>

        <div className="mt-10 border-t border-zinc-800/50 pt-4 text-xs text-zinc-400">
          <div className="flex flex-wrap items-center gap-1">
            {(
              [
                ["/", "Home"],
                ["/about", "About"],
                ["/projects", "Projects"],
                ["/blog", "Blog"],
                ["/contact", "Contact"],
              ] as const
            ).map(([href, label], index) => (
              <span key={href} className="contents">
                {index > 0 && <span className="text-zinc-600">&bull;</span>}
                <Link href={href} className="transition-colors hover:text-zinc-300">
                  {label}
                </Link>
              </span>
            ))}
          </div>

          <p className="mt-2 text-zinc-500">&copy; 2025 - {year} Ridwan Halim</p>
        </div>
      </div>
    </main>
  );
}

const ICON = "w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 transition-transform duration-300";

function HomeIcon() {
  return (
    <svg
      className={`${ICON} group-hover:-rotate-12`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg
      className={`${ICON} group-hover:-translate-x-1`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}
