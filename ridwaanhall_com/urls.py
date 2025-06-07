from django.urls import path, include
from . import views

urlpatterns = [
    path('', include('apps.core.urls')),
    path('', include('apps.pageindex.urls')),
    path('about/', include('apps.about.urls')),
    path('dashboard/', include('apps.dashboard.urls')),
    path('projects/', include('apps.projects.urls')),
    path('blog/', include('apps.blog.urls')),
    
    # Add favicon path before the catch-all
    path('favicon.ico', views.favicon_view, name='favicon'),
    
    path('<path:url>', views.CatchAllView.as_view(), name='catch_all'),
]
