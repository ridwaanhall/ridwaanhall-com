import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { hasTwin, normalise } from "@/lib/site/twins";

/**
 * Marks pages that must never appear in search results.
 *
 * robots.txt and `noindex` solve different problems, and reaching for the wrong
 * one leaves a URL stuck: disallowing a
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
  // them out of the index. `/sign-in` carries no trailing slash on purpose:
  // these are `startsWith` tests, and one written `"/sign-in/"` would miss the
  // page itself -- which is the only thing at that path.
  "/api/auth/",
  "/sign-in",
  "/guestbook/accounts/",
  "/guestbook/logout/",
  // The admin is disallowed in robots.txt as well; this covers anything that
  // reaches it through a link.
  "/admin/",
];

/**
 * Where a request for a page's Markdown is sent: `/md/<path>`, the one handler
 * that renders every twin. `/about.md` and `/about` asked for with
 * `Accept: text/markdown` both land there; `/index.md` and `/` are the home
 * page. Anything else is left alone, so a page that has no twin still answers
 * an Accept header with itself.
 */
function twinRewrite(request: NextRequest): URL | null {
  const path = request.nextUrl.pathname;
  const url = request.nextUrl.clone();
  if (path.endsWith(".md")) {
    const page = path.slice(0, -3);
    if (path === "/index.md") url.pathname = "/md/index";
    else if (hasTwin(page)) url.pathname = `/md${normalise(page)}`;
    else return null;
    return url;
  }
  const accept = request.headers.get("accept") ?? "";
  if (/text\/markdown/.test(accept) && hasTwin(path)) {
    const here = normalise(path);
    url.pathname = here === "/" ? "/md/index" : `/md${here}`;
    return url;
  }
  return null;
}

export function proxy(request: NextRequest) {
  const twin = twinRewrite(request);
  if (twin) return NextResponse.rewrite(twin);

  const response = NextResponse.next();
  if (NOINDEX_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix))) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  // Only the prefixes above, and the two ways of asking for Markdown, can ever
  // match, so everything else skips the proxy entirely rather than paying for a
  // pass-through on every request.
  matcher: [
    // A page's Markdown twin: its own path plus `.md`...
    "/((?!_next|api|md/).*)\\.md",
    // ...or the page itself, when the request prefers Markdown. The header test
    // keeps an ordinary page view out of the proxy entirely.
    {
      source: "/((?!_next|api|md|admin|llms).*)",
      has: [{ type: "header", key: "accept", value: "(.*)text/markdown(.*)" }],
    },
    "/api/auth/:path*",
    "/sign-in",
    "/guestbook/accounts/:path*",
    "/guestbook/logout/:path*",
    "/admin/:path*",
  ],
};
