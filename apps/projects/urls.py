from django.urls import path
from . import views

app_name = 'projects'

urlpatterns = [
    path('', views.project_list, name='list'),
    path('<int:project_id>/', views.project_detail, name='detail'),
]