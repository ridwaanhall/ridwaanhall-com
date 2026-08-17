"""
Marks pages that should never appear in search results.

robots.txt and ``noindex`` solve different problems, and using the wrong one
leaves a URL stuck. Disallowing a path stops the crawl, but a URL that is
disallowed can still be indexed from inbound links -- the crawler is not
allowed to fetch it, so it never sees a ``noindex`` and has no instruction to
drop it. That is exactly how the allauth sign-in pages ended up reported under
"Blocked by robots.txt" rather than removed.

So the two are split:

* ``robots.txt`` disallows what must never be fetched -- POST-only endpoints,
  the admin, redirects to external CV files.
* This middleware sends ``X-Robots-Tag: noindex`` on paths that are fine to
  crawl but must not rank, so Google can read the directive and drop them.
"""

#: Prefixes served with X-Robots-Tag: noindex, nofollow.
NOINDEX_PREFIXES = (
    # Sign-in / sign-up / OAuth callbacks. Crawlable so the directive is seen,
    # but never useful in results.
    "/guestbook/accounts/",
    "/guestbook/logout/",
)


class NoIndexMiddleware:
    """Adds X-Robots-Tag to responses for paths that must stay out of search."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.path.startswith(NOINDEX_PREFIXES):
            response["X-Robots-Tag"] = "noindex, nofollow"
        return response
