"""
Posting and deleting comments.

Both views are POST-then-redirect. The guestbook posts over AJAX and pays for
it by rendering every message twice -- once server-side, once as a JS template
literal that has to be kept in sync by hand. Redirecting instead keeps a
comment's markup in exactly one template, lets Django's messages framework
carry the feedback, and works without JavaScript.
"""

from django.contrib import messages
from django.contrib.contenttypes.models import ContentType
from django.http import Http404, HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.utils.http import url_has_allowed_host_and_scheme
from django.views import View

from apps.comments.forms import CommentForm
from apps.comments.models import Comment
from apps.guestbook.views import UserProfileMixin

#: Only these may be commented on. Without an allowlist, `content_type` is
#: attacker-chosen and comments could be attached to any model in the project.
COMMENTABLE = {
    "blog.blogpost",
    "projects.project",
}


def resolve_target(content_type_label, object_id):
    """Look up the commented object, refusing anything not on the allowlist."""
    label = (content_type_label or "").lower()
    if label not in COMMENTABLE:
        raise Http404("Not commentable")
    try:
        app_label, model = label.split(".")
        content_type = ContentType.objects.get_by_natural_key(app_label, model)
    except (ValueError, ContentType.DoesNotExist) as exc:
        raise Http404("Unknown content type") from exc
    model_class = content_type.model_class()
    if model_class is None:
        raise Http404("Unknown content type")
    return content_type, get_object_or_404(model_class, pk=object_id)


def safe_redirect(request, fallback="/"):
    """Send the user back where they came from, without becoming an open redirect."""
    target = request.POST.get("next") or request.META.get("HTTP_REFERER") or fallback
    if not url_has_allowed_host_and_scheme(
        target, allowed_hosts={request.get_host()}, require_https=request.is_secure()
    ):
        target = fallback
    return HttpResponseRedirect(target)


class PostCommentView(UserProfileMixin, View):
    def post(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            # The template hides the form, but the endpoint has to refuse too --
            # hiding a control is not access control.
            messages.error(request, "Sign in to post a comment.")
            return safe_redirect(request)

        content_type, target = resolve_target(
            request.POST.get("content_type"), request.POST.get("object_id")
        )

        reply_to = None
        reply_to_id = request.POST.get("reply_to")
        if reply_to_id:
            # Scope the parent lookup to this target, so a reply cannot be
            # grafted onto a thread belonging to a different post.
            reply_to = Comment.objects.filter(
                pk=reply_to_id, content_type=content_type, object_id=target.pk
            ).first()
            if reply_to is None:
                messages.error(request, "That comment is no longer available.")
                return safe_redirect(request)

        form = CommentForm(request.POST)
        if not form.is_valid():
            for error in form.errors.get("body", ["Your comment could not be posted."]):
                messages.error(request, error)
            return safe_redirect(request)

        comment = form.save(commit=False)
        comment.user = request.user
        comment.content_type = content_type
        comment.object_id = target.pk
        comment.reply_to = reply_to
        comment.save()

        messages.success(
            request, "Reply posted." if reply_to else "Comment posted."
        )
        return safe_redirect(request)


class DeleteCommentView(UserProfileMixin, View):
    def post(self, request, pk, *args, **kwargs):
        if not request.user.is_authenticated:
            messages.error(request, "Sign in to manage comments.")
            return safe_redirect(request)

        comment = get_object_or_404(Comment, pk=pk)
        profile_data = self.get_user_profile_data(request.user)
        if not comment.can_delete(request.user, profile_data):
            messages.error(request, "You can only delete your own comments.")
            return safe_redirect(request)

        # Soft delete, so replies keep their place in the thread.
        comment.is_deleted = True
        comment.save(update_fields=["is_deleted"])
        messages.success(request, "Comment deleted.")
        return safe_redirect(request)
