from django.urls import path, include
from django.contrib.auth.views import LogoutView
from . import views

urlpatterns = [
    path('', views.GuestbookView.as_view(), name='guestbook'),
    path('accounts/', include('allauth.urls')),
    path('logout/', LogoutView.as_view(next_page='/'), name='logout'),
    path('send-message/', views.SendMessageView.as_view(), name='send_message'),
    path('delete-message/', views.DeleteMessageView.as_view(), name='delete_message'),
]