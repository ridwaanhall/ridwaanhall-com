from django.contrib.sitemaps.views import sitemap
from apps.core.sitemaps import StaticViewSitemap, BlogSitemap, ProjectSitemap
from django.http import HttpResponse

from django.urls import path
from . import views

def robots_txt(request):
    lines = [
        "User-agent: *",
        "Allow: /",
        "Sitemap: " + request.build_absolute_uri('/sitemap.xml'),
    ]
    return HttpResponse("\n".join(lines), content_type="text/plain")

sitemaps = {
    'static': StaticViewSitemap,
    'blog': BlogSitemap,
    'projects': ProjectSitemap,
}

urlpatterns = [
    path('', views.HomeView.as_view(), name='home'),
    path('about/', views.AboutView.as_view(), name='about'),
    path('contact/', views.ContactView.as_view(), name='contact'),
    
    # Sitemap URL
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps},
        name='django.contrib.sitemaps.views.sitemap'),
    
    path('robots.txt', robots_txt, name='robots_txt'),
]