from django.urls import path
from . import views

urlpatterns = [
    path('', views.ProjectsView.as_view(), name='projects'),
    path('projects-detail/', views.ProjectsDetailView.as_view(), name='projects_detail'),
]