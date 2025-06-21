from django.urls import path, include
from django.conf import settings
from . import views

urlpatterns = [
    path('', include('apps.core.urls')),
    path('', include('apps.seo.urls')),
    path('dashboard/', include('apps.dashboard.urls')),
    path('projects/', include('apps.projects.urls')),
    path('blog/', include('apps.blog.urls')),
    path('about/', include('apps.about.urls')),
    
    # Add favicon path before the catch-all
    path('favicon.ico', views.favicon_view, name='favicon'),
]

# Conditionally include guestbook URLs (which includes allauth URLs)
if getattr(settings, 'GUESTBOOK_PAGE', True):
    urlpatterns.insert(-1, path('guestbook/', include('apps.guestbook.urls')))
else:
    # If guestbook is disabled, we might still want basic allauth URLs for admin access
    # But since allauth apps won't be installed, we skip this entirely
    pass

# Custom error handlers
handler404 = 'FlexForge.views.custom_404_view'
