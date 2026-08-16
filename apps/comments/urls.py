from django.urls import path

from . import views

app_name = "comments"

urlpatterns = [
    path("post/", views.PostCommentView.as_view(), name="post"),
    path("<int:pk>/delete/", views.DeleteCommentView.as_view(), name="delete"),
]
