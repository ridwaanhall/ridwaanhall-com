import type { Metadata } from "next";

import { ErrorPage } from "@/components/site/error-page";

/**
 * 404.
 *
 * `noindex` matters here: without it a mistyped or stale URL can be indexed as
 * a real page, and a site with many soft-404s in the index ranks worse for the
 * pages that do exist.
 */
export const metadata: Metadata = {
  title: "Page Not Found - ridwaanhall.com",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <ErrorPage code={404} />;
}
