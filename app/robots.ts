import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo/config";

/**
 * robots.txt.
 *
 * Every disallowed path here was earning a real Search Console error:
 *
 * - The POST-only endpoints answer a GET with 405 or a redirect, which Google
 *   logged as "Not found".
 * - The CV routes redirect to externally hosted files, logged as "Page with
 *   redirect".
 * - `/static/` is served directly and adds nothing to the index.
 *
 * The sign-in paths are deliberately **not** listed. Blocking them stops the
 * crawl, which also stops Google seeing a `noindex`, so they linger in the
 * index as "Blocked by robots.txt". They get an `X-Robots-Tag: noindex` header
 * instead -- see proxy.ts.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/static/",
        // POST-only endpoints: a crawler following them gets an error, not a page.
        "/guestbook/send-message/",
        "/guestbook/delete-message/",
        "/guestbook/pin-message/",
        "/comments/",
        "/api/",
        // Redirects to externally hosted CV files.
        "/cv/",
        "/cv-latest/",
        "/cv-copy/",
      ],
    },
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/sitemap-static.xml`,
      `${SITE_URL}/sitemap-blog.xml`,
      `${SITE_URL}/sitemap-projects.xml`,
    ],
  };
}
