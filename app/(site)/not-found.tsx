import type { Metadata } from "next";

import { ErrorPage } from "@/components/site/error-page";

/**
 * 404 raised by a public page -- `notFound()` from a missing slug, or
 * `/openhire` while neither flag is set.
 *
 * Its own file rather than falling through to `app/not-found.tsx`, which
 * draws a full-screen page with its own links: rendered inside this group's
 * navbar and footer, that doubled the link row and the copyright line.
 */
export const metadata: Metadata = {
  title: "Page Not Found - ridwaanhall.com",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <ErrorPage code={404} embedded />;
}
