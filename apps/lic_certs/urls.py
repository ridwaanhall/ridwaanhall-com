from django.urls import path
from . import views

app_name = 'lic_certs'

urlpatterns = [
    path('', views.certifications_list, name='list'),
]