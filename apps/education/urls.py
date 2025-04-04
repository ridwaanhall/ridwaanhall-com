from django.urls import path
from . import views

urlpatterns = [
    path('', views.EducationView.as_view(), name='education'),
]