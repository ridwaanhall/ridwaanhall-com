"use client";

import { useEffect, useRef } from "react";

/**
 * Count one view of a blog post.
 *
 * Django incremented in the detail view itself -- `BlogPost.objects.filter(...)
 * .update(views=F("views") + 1)` on every request. That cannot survive the port
 * as-is: this page is prerendered from `generateStaticParams`, so the server
 * renders it once at build time and serves the same HTML to everyone. Counting
 * there would record exactly one view per deploy.
 *
 * So the count moves to the browser, which changes what the number means, and
 * arguably for the better: it now counts readers whose browser ran the page
 * rather than requests, so a crawler, a prefetch and the prerender itself are
 * all excluded. It also means the count is best-effort -- a reader with
 * JavaScript off is not counted -- which is the right trade for a vanity metric
 * that must never delay or break the article.
 *
 * `POST /api/blog/<slug>/` is the endpoint, and it already existed;
 * `incrementBlogViews` issues a raw `views = views + 1` so concurrent readers
 * cannot lose an increment, exactly as `F("views") + 1` did.
 *
 * Renders nothing.
 */
export function ViewCounter({ slug }: { slug: string }) {
  const counted = useRef(false);

  useEffect(() => {
    // React runs effects twice in development's Strict Mode, and the count
    // must not double on a developer's machine.
    if (counted.current) return;
    counted.current = true;

    // `keepalive` so the request survives a reader who clicks away
    // immediately; a failure is swallowed, since a missed tick on a view
    // counter is not worth a console error on an article page.
    void fetch(`/api/blog/${encodeURIComponent(slug)}/`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {});
  }, [slug]);

  return null;
}
