"""
Context builder for the comment section.

Kept out of the views so the blog and project detail views each add comments in
one line, and so the query shape lives in one place.
"""

from apps.comments.forms import CommentForm
from apps.comments.models import Comment


def comment_context(request, model, object_id, label):
    """Everything ``comments/_section.html`` needs for one commented object.

    Takes the model class and id rather than an instance, because the blog and
    project detail views hold their target as a cached dict -- loading the row
    just to build this would cost the round trip the content cache saved.

    ``label`` is the "app_label.model" string the form posts back, and must be
    on ``apps.comments.views.COMMENTABLE``.
    """
    comments = list(Comment.for_target(model, object_id))

    # Count from what was just fetched instead of issuing a COUNT: the replies
    # are already prefetched, so the numbers are in memory and a second query
    # would buy nothing.
    comment_count = sum(
        (0 if comment.is_deleted else 1)
        + sum(1 for reply in comment.replies.all() if not reply.is_deleted)
        for comment in comments
    )

    # Work out delete permission here rather than in the template: the check
    # needs the viewer's author/co-author flags, which cost a query, and doing
    # it per comment in the template would repeat that for every row.
    deletable_ids = set()
    if request.user.is_authenticated:
        from apps.guestbook.views import UserProfileMixin

        profile_data = UserProfileMixin.get_user_profile_data(request.user)
        for comment in comments:
            if comment.can_delete(request.user, profile_data):
                deletable_ids.add(comment.pk)
            for reply in comment.replies.all():
                if reply.can_delete(request.user, profile_data):
                    deletable_ids.add(reply.pk)

    return {
        "comments": comments,
        "comment_count": comment_count,
        "comment_form": CommentForm(),
        "comment_target_label": label,
        "comment_target_id": object_id,
        "deletable_ids": deletable_ids,
    }
