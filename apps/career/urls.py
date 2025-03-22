from django.urls import path
from . import views

urlpatterns = [
    path('', views.CareerView.as_view(), name='career'),
]