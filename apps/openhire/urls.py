from django.urls import path
from . import views

urlpatterns = [
    path('', views.OpenHireView.as_view(), name='openhire'),
]
