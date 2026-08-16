"""
Comments on blog posts and projects.

One model with a generic relation serves both targets, rather than a
BlogComment/ProjectComment pair that would duplicate the form, view, admin and
templates as well as the table.

Deliberately *not* registered in ``apps.core.cache.MODEL_NAMESPACES``: those
namespaces invalidate the cached blog/project payloads, so mapping comments
into one would make every comment posted force a full rebuild from Supabase on
the busiest pages. Comments are read per request instead, as a single indexed
lookup on (content_type, object_id).
"""

from django.contrib.auth.models import User
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

MAX_COMMENT_LENGTH = 1000


class Comment(models.Model):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    target = GenericForeignKey("content_type", "object_id")

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    body = models.TextField(max_length=MAX_COMMENT_LENGTH)

    reply_to = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="replies"
    )
    # Soft delete: a removed parent must not take its replies with it, and the
    # thread stays readable with a tombstone in place of the original text.
    is_deleted = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["content_type", "object_id", "created_at"]),
        ]

    def __str__(self):
        return f"{self.user.username} on {self.content_type.model} #{self.object_id}"

    def save(self, *args, **kwargs):
        # Flatten to a single level. Doing it here rather than in the view means
        # the invariant holds however the comment was created -- admin, shell,
        # data import -- not just through the form.
        if self.reply_to is not None and self.reply_to.reply_to_id is not None:
            self.reply_to = self.reply_to.reply_to
        # A reply always belongs to the same target as its parent; trusting the
        # submitted object_id here would let a crafted POST attach a reply to a
        # thread on a different post.
        if self.reply_to is not None:
            self.content_type = self.reply_to.content_type
            self.object_id = self.reply_to.object_id
        super().save(*args, **kwargs)

    @property
    def display_body(self):
        return "" if self.is_deleted else self.body

    def can_delete(self, user, profile_data=None):
        """Own comment, or any comment when the viewer is an author/co-author."""
        if not user.is_authenticated or self.is_deleted:
            return False
        if self.user_id == user.pk:
            return True
        if profile_data:
            return bool(profile_data.get("is_author") or profile_data.get("is_co_author"))
        return False

    # Both helpers take the model *class* and an id rather than an instance.
    # The detail views hold their post/project as a cached dict, so requiring an
    # instance would mean re-fetching a row purely to derive a ContentType --
    # exactly the round trip the content cache exists to avoid. ContentType is
    # itself cached in-process by Django after first lookup.

    @classmethod
    def for_target(cls, model, object_id):
        """Top-level comments for an object, with replies and authors prefetched."""
        content_type = ContentType.objects.get_for_model(model)
        return (
            cls.objects.filter(
                content_type=content_type, object_id=object_id, reply_to__isnull=True
            )
            .select_related("user", "user__userprofile")
            .prefetch_related("replies__user", "replies__user__userprofile")
        )

    @classmethod
    def count_for_target(cls, model, object_id):
        """Every non-deleted comment on an object, replies included."""
        content_type = ContentType.objects.get_for_model(model)
        return cls.objects.filter(
            content_type=content_type, object_id=object_id, is_deleted=False
        ).count()
