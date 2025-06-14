from django.urls import path, include
from . import views

urlpatterns = [
    path('', include('apps.core.urls')),
    path('', include('apps.seo.urls')),
    path('about/', include('apps.about.urls')),
    path('dashboard/', include('apps.dashboard.urls')),
    path('projects/', include('apps.projects.urls')),
    path('blog/', include('apps.blog.urls')),
    
    # Add favicon path before the catch-all
    path('favicon.ico', views.favicon_view, name='favicon'),
]

# Custom error handlers
handler404 = 'ridwaanhall_com.views.custom_404_view'
