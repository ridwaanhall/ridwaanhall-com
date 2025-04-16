from django.urls import path, include
from . import views

urlpatterns = [
    path('', include('apps.core.urls')),
    path('', include('apps.pageindex.urls')),
    path('career/', include('apps.career.urls')),
    path('dashboard/', include('apps.dashboard.urls')),
    path('projects/', include('apps.projects.urls')),
    path('blog/', include('apps.blog.urls')),
    
    path('<path:url>', views.CatchAllView.as_view(), name='catch_all'),
]
