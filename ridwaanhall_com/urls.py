from django.urls import path, include
from django.conf import settings
from . import views
from .error_handlers import handler400, handler403, handler404, handler500

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

# Add error testing URLs only in DEBUG mode
if settings.DEBUG:
    from . import test_views
    
    test_patterns = [
        path('test-errors/', test_views.error_test_menu, name='error_test_menu'),
        path('test-errors/400/', test_views.test_400_error, name='test_400'),
        path('test-errors/403/', test_views.test_403_error, name='test_403'),
        path('test-errors/404/', test_views.test_404_error, name='test_404'),
        path('test-errors/500/', test_views.test_500_error, name='test_500'),
        path('test-errors/ajax/', test_views.test_ajax_error, name='test_ajax'),
    ]
    
    urlpatterns = test_patterns + urlpatterns
