import "server-only";

import { SITE_URL } from "@/lib/seo/config";

/**
 * How a Markdown response is sent.
 *
 * `noindex` and a canonical `Link` to the page: the twin is a copy for
 * readers that want text, and a search engine should keep ranking the page.
 * `Vary: Accept` because the page's own address also answers with Markdown to
 * `Accept: text/markdown`, and a cache that stored one format would otherwise
 * serve it to everybody.
 */
export function markdown(body: string, canonical?: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      Vary: "Accept",
      "X-Robots-Tag": "noindex",
      ...(canonical ? { Link: `<${SITE_URL}${canonical}>; rel="canonical"` } : {}),
    },
  });
}

export function plain(body: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export const missing = () => markdown("# Not found\n\nThere is no Markdown for that address. See [llms.txt](/llms.txt).\n", undefined, 404);
