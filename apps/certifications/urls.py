from django.urls import path
from . import views

urlpatterns = [
    path('', views.CertificationsView.as_view(), name='certifications'),
]