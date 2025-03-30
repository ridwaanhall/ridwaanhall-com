from django.contrib.sitemaps.views import sitemap, index
from apps.core.sitemaps import StaticViewSitemap, BlogSitemap, ProjectSitemap
from django.http import HttpResponse

from django.urls import path
from . import views

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
        "Crawl-delay: 10",  # Be nice to search engines
    ]
    return HttpResponse("\n".join(lines), content_type="text/plain")

# Define individual sitemaps
static_sitemap = {'static': StaticViewSitemap}
blog_sitemap = {'blog': BlogSitemap}
project_sitemap = {'projects': ProjectSitemap}

# Combined sitemap dictionary for the index
sitemaps = {**static_sitemap, **blog_sitemap, **project_sitemap}

urlpatterns = [
    path('', views.HomeView.as_view(), name='home'),
    path('about/', views.AboutView.as_view(), name='about'),
    path('contact/', views.ContactView.as_view(), name='contact'),
    
    # Main sitemap index
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps}, name='django.contrib.sitemaps.views.sitemap'),
    
    # Individual sitemaps
    path('sitemap-static.xml', sitemap, {'sitemaps': static_sitemap}, name='sitemap-static'),
    path('sitemap-blog.xml', sitemap, {'sitemaps': blog_sitemap}, name='sitemap-blog'),
    path('sitemap-projects.xml', sitemap, {'sitemaps': project_sitemap}, name='sitemap-projects'),
    
    path('robots.txt', robots_txt, name='robots_txt'),
]
