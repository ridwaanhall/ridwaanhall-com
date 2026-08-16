from django.urls import path

from . import views

urlpatterns = [
    path("legal/<slug:slug>/", views.LegalDocumentView.as_view(), name="legal_document"),
]
