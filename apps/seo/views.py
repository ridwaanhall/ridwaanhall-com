"""
SEO views for robots.txt and other SEO-related endpoints.
"""

from django.http import HttpResponse
from django.views.decorators.cache import cache_page
from django.views.decorators.http import require_http_methods


@cache_page(60 * 60 * 24)  # Cache for 24 hours
@require_http_methods(["GET", "HEAD"])
def robots_txt(request):
    """
    Generate robots.txt file dynamically.
    Includes sitemap URLs and proper directives for SEO.
    """
    base_url = request.build_absolute_uri('/').rstrip('/')
    
    lines = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin/",
        "Disallow: /static/",
        "",
        f"Sitemap: {base_url}/sitemap.xml",
        f"Sitemap: {base_url}/sitemap-static.xml",
        f"Sitemap: {base_url}/sitemap-blog.xml",
        f"Sitemap: {base_url}/sitemap-projects.xml",
    ]
    
    return HttpResponse("\n".join(lines), content_type="text/plain")
