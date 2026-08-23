import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Marks pages that must never appear in search results.
 *
 * A port of apps/seo/middleware.py. robots.txt and `noindex` solve different
 * problems, and reaching for the wrong one leaves a URL stuck: disallowing a
 * path stops the crawl, but a disallowed URL can still be *indexed* from
 * inbound links -- the crawler is not allowed to fetch it, so it never sees a
 * `noindex` and has no instruction to drop it. That is exactly how the sign-in
 * pages ended up reported under "Blocked by robots.txt" rather than removed.
 *
 * So the two are split:
 *
 * - `robots.ts` disallows what must never be fetched: POST-only endpoints, the
 *   admin, redirects to externally hosted CV files.
 * - This sends `X-Robots-Tag: noindex` on paths that are fine to crawl but must
 *   not rank, so Google can read the directive and drop them.
 */
const NOINDEX_PREFIXES = [
  // Sign-in / sign-up / OAuth callbacks. Crawlable so the directive is seen,
  // but never useful in results. The `/guestbook/accounts/` prefixes are older
  // paths that still receive inbound links; the header costs nothing and keeps
  // them out of the index.
  "/api/auth/",
  "/guestbook/accounts/",
  "/guestbook/logout/",
  // The admin is disallowed in robots.txt as well; this covers anything that
  // reaches it through a link.
  "/admin/",
];

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  if (NOINDEX_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix))) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  // Only the prefixes above can ever match, so everything else skips the proxy
  // entirely rather than paying for a pass-through on every request.
  matcher: ["/api/auth/:path*", "/guestbook/accounts/:path*", "/guestbook/logout/:path*", "/admin/:path*"],
};
