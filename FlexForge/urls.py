from django.conf import settings
from django.contrib import admin
from django.urls import include, path

from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('apps.core.urls')),
    path('', include('apps.seo.urls')),
    path('dashboard/', include('apps.dashboard.urls')),
    path('projects/', include('apps.projects.urls')),
    path('blog/', include('apps.blog.urls')),
    path('about/', include('apps.about.urls')),
    path('openhire/', include('apps.openhire.urls')),
    path('', include('apps.legal.urls')),
    
    # Add favicon path before the catch-all
    path('favicon.ico', views.favicon_view, name='favicon'),
]

# Conditionally include guestbook URLs (which includes allauth URLs)
if getattr(settings, 'GUESTBOOK_PAGE', True):
    urlpatterns.insert(-1, path('guestbook/', include('apps.guestbook.urls')))
    # Comments depend on the same allauth providers as the guestbook.
    urlpatterns.insert(-1, path('comments/', include('apps.comments.urls')))
else:
    # If guestbook is disabled, we might still want basic allauth URLs for admin access
    # But since allauth apps won't be installed, we skip this entirely
    pass

# Serve locally-uploaded media in development (production images live on
# Supabase Storage and never pass through Django at all).
if settings.DEBUG:
    from django.conf.urls.static import static
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Custom error handlers
handler404 = 'FlexForge.views.custom_404_view'
