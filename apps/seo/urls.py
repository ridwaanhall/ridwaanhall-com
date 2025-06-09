"""
SEO URL patterns for sitemaps, robots.txt, and other SEO endpoints.
Provides comprehensive SEO URL routing.
"""

from django.contrib.sitemaps.views import sitemap
from django.urls import path

from .sitemaps import StaticPagesSitemap, BlogSitemap, ProjectSitemap
from .views import robots_txt


# Define sitemap collections
static_sitemap = {'static': StaticPagesSitemap}
blog_sitemap = {'blog': BlogSitemap}
project_sitemap = {'projects': ProjectSitemap}

# Combine all sitemaps
sitemaps = {**static_sitemap, **blog_sitemap, **project_sitemap}

app_name = 'seo'

urlpatterns = [
    # SEO files
    path('robots.txt', robots_txt, name='robots_txt'),
    
    # Sitemap URLs
    path('sitemap.xml', 
         sitemap, 
         {'sitemaps': sitemaps}, 
         name='sitemap'),
    
    path('sitemap-static.xml', 
         sitemap, 
         {'sitemaps': static_sitemap}, 
         name='sitemap_static'),
    
    path('sitemap-blog.xml', 
         sitemap, 
         {'sitemaps': blog_sitemap}, 
         name='sitemap_blog'),
    
    path('sitemap-projects.xml', 
         sitemap, 
         {'sitemaps': project_sitemap}, 
         name='sitemap_projects'),
]
