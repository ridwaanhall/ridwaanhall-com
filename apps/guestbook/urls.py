from django.urls import path, include
from django.contrib.auth.views import LogoutView
from . import views

urlpatterns = [
    path('', views.guestbook, name='guestbook'),
    path('accounts/', include('allauth.urls')),
    path('logout/', LogoutView.as_view(next_page='/'), name='logout'),
    path('send-message/', views.send_message, name='send_message'),
]