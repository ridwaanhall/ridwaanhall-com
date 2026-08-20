"use client";

import Link from "next/link";

import { useCurrentYear } from "@/lib/utils/use-current-year";

/**
 * The shared error page.
 *
 * A port of templates/error.html, which Django rendered as a standalone shell
 * with its own copy of the theme bootstrap and its own `<head>`. Here it is an
 * ordinary component: `not-found.tsx` and `error.tsx` both render it, and both
 * sit inside the root layout, so the palette, fonts and theme script come from
 * one place instead of being hand-synced.
 *
 * It deliberately renders *outside* the site shell -- no sidebar, no nav. An
 * error page that reproduces the whole chrome invites the reader to keep
 * browsing from a broken state; the "common pages" row below gives them the
 * same links without the pretence that the page loaded.
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
    <div className="container mx-auto min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md border border-zinc-800 rounded-xl p-8 hover:border-zinc-700 transition-all duration-300">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-pink-600/20 border border-red-500/30 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              {/* `animate-ping`, not a transition -- it keeps running while the
                  page sits there, which is the point. */}
              <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-red-500/30 animate-ping" />
            </div>
          </div>

          <div>
            <h1 className="text-6xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-pink-600">
              {code}
            </h1>
            <div className="w-16 h-0.5 bg-gradient-to-r from-red-500 to-pink-600 mx-auto rounded-full" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-zinc-100">{title}</h2>
            <p className="text-zinc-400 leading-relaxed">{message}</p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
            <Link
              href="/"
              className="group flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-6 py-3 text-base font-medium text-zinc-50 hover:border-zinc-400 hover:bg-zinc-900 transition-all duration-300 justify-center"
            >
              <svg
                className="w-5 h-5 transition-transform duration-300 group-hover:-rotate-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Go to Homepage
            </Link>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="group flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-6 py-3 text-base font-medium text-zinc-50 hover:border-zinc-400 hover:bg-zinc-900 transition-all duration-300 justify-center"
            >
              <svg
                className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Go Back
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-zinc-500 text-sm mb-4">Need help? Try these common pages:</p>
        <div className="flex flex-wrap justify-center gap-3">
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
              {index > 0 && <span className="text-zinc-600">•</span>}
              <Link
                href={href}
                className="text-sm text-zinc-400 hover:text-indigo-400 transition-colors duration-200 hover:underline"
              >
                {label}
              </Link>
            </span>
          ))}
        </div>
      </div>

      <footer className="mt-10 text-zinc-500 text-sm text-center">
        <p>&copy; {year} Ridwan Halim. All rights reserved.</p>
      </footer>
    </div>
  );
}
