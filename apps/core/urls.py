from django.urls import path
from . import views

urlpatterns = [
    path('', views.HomeView.as_view(), name='home'),
    path('contact/', views.ContactView.as_view(), name='contact'),
    path('privacy-policy/', views.PrivacyPolicyView.as_view(), name='privacy'),
    
    # Professional CV redirect endpoints
    path('cv/', views.CVRedirectView.as_view(), name='cv_redirect'), # Redirects to the main CV in pdf format
    path('cv-latest/', views.CVLatestRedirectView.as_view(), name='cv_latest_redirect'), # Redirects to the latest CV in word format
    path('cv-copy/', views.CVTemplateRedirectView.as_view(), name='cv_copy_redirect'), # Redirects to the CV template copy
]
