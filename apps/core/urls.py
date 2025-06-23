from django.urls import path
from . import views

urlpatterns = [
    path('', views.HomeView.as_view(), name='home'),
    path('contact/', views.ContactView.as_view(), name='contact'),
    path('privacy-policy/', views.PrivacyPolicyView.as_view(), name='privacy'),
    
    # Professional CV redirect endpoints
    path('cv/', views.CVRedirectView.as_view(), name='cv_redirect'),
    path('cv-template/', views.CVTemplateRedirectView.as_view(), name='cv_template_redirect'),
]
