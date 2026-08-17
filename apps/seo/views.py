"""
SEO views for robots.txt and other SEO-related endpoints.
"""

from django.http import HttpResponse
from django.views.decorators.cache import cache_page
from django.views.decorators.http import require_http_methods

#: Paths crawlers should not follow.
#:
#: Every entry here was earning a real Search Console error. The POST-only
#: endpoints (send-message, pin-message, delete-message, the comment routes)
#: answer a GET with 405 or a redirect, and Google logged them as "Not found";
#: the CV routes are redirects to external files, logged as "Page with
#: redirect"; and the allauth pages under /accounts/ are sign-in flows that
#: should never be indexed.
#:
#: Ordering is broad-to-specific for readability only -- robots.txt has no
#: precedence rules beyond longest-match, and none of these overlap.
DISALLOWED_PATHS = [
    # Django admin.
    "/admin/",
    # Static assets are served directly and add nothing to the index.
    "/static/",
    # NB: the allauth sign-in pages under /guestbook/accounts/ are deliberately
    # *not* listed. Blocking them stops the crawl, which also stops Google
    # seeing a noindex, so they linger in the index as "Blocked by robots.txt".
    # apps/seo/middleware.py sends X-Robots-Tag: noindex for those instead.
    # POST-only endpoints: a crawler following them gets an error, not a page.
    "/guestbook/send-message/",
    "/guestbook/delete-message/",
    "/guestbook/pin-message/",
    "/comments/",
    # Redirects to externally hosted CV files.
    "/cv/",
    "/cv-latest/",
    "/cv-copy/",
]

SITEMAPS = [
    "sitemap.xml",
    "sitemap-static.xml",
    "sitemap-blog.xml",
    "sitemap-projects.xml",
]


@cache_page(60 * 60 * 24)  # Cache for 24 hours
@require_http_methods(["GET", "HEAD"])
def robots_txt(request):
    """
    Generate robots.txt file dynamically.
    Includes sitemap URLs and proper directives for SEO.
    """
    base_url = request.build_absolute_uri('/').rstrip('/')

    lines = ["User-agent: *", "Allow: /"]
    lines += [f"Disallow: {path}" for path in DISALLOWED_PATHS]
    lines.append("")
    lines += [f"Sitemap: {base_url}/{name}" for name in SITEMAPS]

    return HttpResponse("\n".join(lines), content_type="text/plain")
