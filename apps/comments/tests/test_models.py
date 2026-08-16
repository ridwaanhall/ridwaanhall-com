"""Comment model invariants."""

from datetime import UTC, datetime

from django.contrib.auth.models import User
from django.test import TestCase

from apps.blog.models import BlogPost
from apps.comments.models import Comment
from apps.projects.models import Project

AT = datetime(2026, 1, 1, tzinfo=UTC)


class CommentModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("alice", "alice@example.com")
        self.post = BlogPost.objects.create(
            title="Post", slug="post", author="A", created_at=AT, updated_at=AT
        )

    def comment(self, body="hello", user=None, reply_to=None, target=None):
        target = target or self.post
        return Comment.objects.create(
            target=target, user=user or self.user, body=body, reply_to=reply_to
        )

    def test_a_comment_attaches_to_its_target(self):
        comment = self.comment()
        self.assertEqual(comment.target, self.post)
        self.assertEqual(comment.object_id, self.post.pk)

    def test_replies_are_flattened_to_one_level(self):
        """A reply to a reply re-parents to the top-level comment, so a thread
        can never nest deeper than one level however it was created."""
        top = self.comment("top")
        reply = self.comment("reply", reply_to=top)
        nested = self.comment("nested", reply_to=reply)

        self.assertEqual(reply.reply_to, top)
        self.assertEqual(nested.reply_to, top, "should re-parent to the top-level comment")

    def test_a_reply_inherits_its_parents_target(self):
        """Otherwise a crafted object_id could graft a reply onto a thread that
        belongs to a different post."""
        other = Project.objects.create(title="P", slug="p", created_at=AT, updated_at=AT)
        top = self.comment("top")

        reply = Comment.objects.create(
            target=other, user=self.user, body="reply", reply_to=top
        )

        self.assertEqual(reply.object_id, self.post.pk)
        self.assertEqual(reply.content_type, top.content_type)

    def test_soft_deleting_a_parent_keeps_its_replies(self):
        top = self.comment("top")
        self.comment("reply", reply_to=top)

        top.is_deleted = True
        top.save()

        self.assertEqual(top.replies.count(), 1)
        self.assertEqual(top.display_body, "")

    def test_for_target_returns_only_top_level_comments(self):
        top = self.comment("top")
        self.comment("reply", reply_to=top)

        found = list(Comment.for_target(BlogPost, self.post.pk))

        self.assertEqual([c.pk for c in found], [top.pk])

    def test_for_target_does_not_leak_across_objects(self):
        other = BlogPost.objects.create(
            title="Other", slug="other", author="A", created_at=AT, updated_at=AT
        )
        self.comment("mine")
        self.comment("theirs", target=other)

        self.assertEqual(len(list(Comment.for_target(BlogPost, self.post.pk))), 1)

    def test_count_includes_replies_but_not_deleted(self):
        top = self.comment("top")
        self.comment("reply", reply_to=top)
        gone = self.comment("gone")
        gone.is_deleted = True
        gone.save()

        self.assertEqual(Comment.count_for_target(BlogPost, self.post.pk), 2)

    def test_comments_are_ordered_oldest_first(self):
        first = self.comment("first")
        second = self.comment("second")
        self.assertEqual(
            [c.pk for c in Comment.objects.all()], [first.pk, second.pk]
        )

    # -- delete permission -------------------------------------------------

    def test_a_user_can_delete_their_own_comment(self):
        comment = self.comment()
        self.assertTrue(comment.can_delete(self.user, {}))

    def test_a_user_cannot_delete_someone_elses(self):
        other = User.objects.create_user("bob", "bob@example.com")
        comment = self.comment()
        self.assertFalse(comment.can_delete(other, {}))

    def test_an_author_can_delete_any_comment(self):
        other = User.objects.create_user("bob", "bob@example.com")
        comment = self.comment()
        self.assertTrue(comment.can_delete(other, {"is_author": True}))

    def test_a_co_author_can_delete_any_comment(self):
        other = User.objects.create_user("bob", "bob@example.com")
        comment = self.comment()
        self.assertTrue(comment.can_delete(other, {"is_co_author": True}))

    def test_an_already_deleted_comment_is_not_deletable_again(self):
        comment = self.comment()
        comment.is_deleted = True
        self.assertFalse(comment.can_delete(self.user, {"is_author": True}))
