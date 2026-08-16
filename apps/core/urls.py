from django.urls import path

from apps.legal.views import LegalDocumentView, PrivacyPolicyView

from . import views

urlpatterns = [
    path('', views.HomeView.as_view(), name='home'),
    path('contact/', views.ContactView.as_view(), name='contact'),
    # Served by the legal app now; the path is unchanged because the sitemap,
    # SEO config, page footer and search modal all reference it.
    path('privacy-policy/', PrivacyPolicyView.as_view(), name='privacy'),
    path('terms/', LegalDocumentView.as_view(slug='terms-and-conditions'), name='terms'),
    
    # Professional CV redirect endpoints
    path('cv/', views.CVRedirectView.as_view(), name='cv_redirect'), # Redirects to the main CV in pdf format
    path('cv-latest/', views.CVLatestRedirectView.as_view(), name='cv_latest_redirect'), # Redirects to the latest CV in word format
    path('cv-copy/', views.CVTemplateRedirectView.as_view(), name='cv_copy_redirect'), # Redirects to the CV template copy
    
    # Dynamic CSS endpoints
    path('css/<str:css_name>.css', views.dynamic_css_view, name='dynamic_css'),
    
    # Dynamic webmanifest endpoint
    path('site.webmanifest', views.dynamic_webmanifest_view, name='dynamic_webmanifest'),
]
