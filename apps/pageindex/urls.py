from django.contrib.sitemaps.views import sitemap
from apps.pageindex.sitemaps import (
    StaticViewSitemap, BlogSitemap, ProjectSitemap,
)
from django.http import HttpResponse

from django.urls import path

def robots_txt(request):
    base_url = request.build_absolute_uri('/').rstrip('/')
    lines = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin/",  # Prevent indexing admin pages
        f"Sitemap: {base_url}/sitemap.xml",
        f"Sitemap: {base_url}/sitemap-static.xml",
        f"Sitemap: {base_url}/sitemap-blog.xml",
        f"Sitemap: {base_url}/sitemap-projects.xml",
    ]
    return HttpResponse("\n".join(lines), content_type="text/plain")

# Define individual sitemaps
static_sitemap = {'static': StaticViewSitemap}
blog_sitemap = {
    'blog': BlogSitemap,
}
project_sitemap = {
    'projects': ProjectSitemap,
}

sitemaps = {**static_sitemap, **blog_sitemap, **project_sitemap}

urlpatterns = [
    path('robots.txt', robots_txt, name='robots_txt'),
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps}, name='django.contrib.sitemaps.views.sitemap'),
    path('sitemap-static.xml', sitemap, {'sitemaps': static_sitemap}, name='sitemap-static'),
    path('sitemap-blog.xml', sitemap, {'sitemaps': blog_sitemap}, name='sitemap-blog'),
    path('sitemap-projects.xml', sitemap, {'sitemaps': project_sitemap}, name='sitemap-projects'),
]
