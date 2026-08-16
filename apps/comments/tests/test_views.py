"""Posting and deleting comments over HTTP.

SECURE_SSL_REDIRECT is forced off because it is tied to ``not DEBUG``: with
DEBUG=True locally these pass either way, but CI runs DEBUG=False, where every
request would 301 to https:// before reaching the view.
"""

from datetime import UTC, datetime

from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from django.urls import reverse

from apps.about.models import Profile
from apps.blog.models import BlogPost
from apps.comments.models import Comment
from apps.projects.models import Project

AT = datetime(2026, 1, 1, tzinfo=UTC)


@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=["testserver"])
class PostCommentViewTest(TestCase):
    def setUp(self):
        # The redirect target is a real detail page, which needs profile data
        # to render -- the message assertions below follow the redirect.
        Profile.objects.create(name="Me")
        self.user = User.objects.create_user("alice", "alice@example.com", "pw")
        self.post = BlogPost.objects.create(
            title="Post", slug="post", author="A", created_at=AT, updated_at=AT
        )
        self.project = Project.objects.create(
            title="Proj", slug="proj", created_at=AT, updated_at=AT
        )
        self.url = reverse("comments:post")

    def payload(self, **overrides):
        data = {
            "content_type": "blog.blogpost",
            "object_id": self.post.pk,
            "body": "Nice write-up",
            "next": "/blog/post/",
        }
        data.update(overrides)
        return data

    def test_a_signed_in_user_can_comment(self):
        self.client.force_login(self.user)

        response = self.client.post(self.url, self.payload())

        self.assertEqual(response.status_code, 302)
        self.assertEqual(Comment.objects.count(), 1)
        self.assertEqual(Comment.objects.get().body, "Nice write-up")

    def test_comments_work_on_projects_too(self):
        self.client.force_login(self.user)

        self.client.post(self.url, self.payload(
            content_type="projects.project", object_id=self.project.pk
        ))

        self.assertEqual(Comment.objects.get().target, self.project)

    def test_a_signed_out_post_is_rejected(self):
        """The template hides the form, but hiding a control is not access
        control -- the endpoint has to refuse as well."""
        response = self.client.post(self.url, self.payload())

        self.assertEqual(Comment.objects.count(), 0)
        self.assertEqual(response.status_code, 302)

    def test_a_signed_out_post_explains_why(self):
        response = self.client.post(self.url, self.payload(), follow=True)
        self.assertContains(response, "Sign in to post a comment.")

    def test_an_empty_comment_is_rejected(self):
        self.client.force_login(self.user)

        self.client.post(self.url, self.payload(body="   "))

        self.assertEqual(Comment.objects.count(), 0)

    def test_a_reply_is_attached_to_its_parent(self):
        self.client.force_login(self.user)
        parent = Comment.objects.create(target=self.post, user=self.user, body="top")

        self.client.post(self.url, self.payload(body="a reply", reply_to=parent.pk))

        self.assertEqual(Comment.objects.get(body="a reply").reply_to, parent)

    def test_a_reply_to_a_comment_on_another_object_is_refused(self):
        """Scoping the parent lookup to the target stops a crafted POST from
        grafting a reply onto an unrelated thread."""
        self.client.force_login(self.user)
        elsewhere = Comment.objects.create(
            target=self.project, user=self.user, body="other thread"
        )

        self.client.post(self.url, self.payload(body="sneaky", reply_to=elsewhere.pk))

        self.assertFalse(Comment.objects.filter(body="sneaky").exists())

    def test_only_allowlisted_models_can_be_commented_on(self):
        """Without the allowlist, content_type is attacker-chosen and comments
        could be hung off any model in the project."""
        self.client.force_login(self.user)

        response = self.client.post(self.url, self.payload(
            content_type="auth.user", object_id=self.user.pk
        ))

        self.assertEqual(response.status_code, 404)
        self.assertEqual(Comment.objects.count(), 0)

    def test_an_unknown_object_404s(self):
        self.client.force_login(self.user)
        response = self.client.post(self.url, self.payload(object_id=99999))
        self.assertEqual(response.status_code, 404)

    def test_redirect_cannot_be_pointed_off_site(self):
        self.client.force_login(self.user)

        response = self.client.post(self.url, self.payload(next="https://evil.example/"))

        self.assertEqual(response.status_code, 302)
        self.assertNotIn("evil.example", response["Location"])

    def test_success_is_reported_through_django_messages(self):
        self.client.force_login(self.user)
        response = self.client.post(self.url, self.payload(), follow=True)
        self.assertContains(response, "Comment posted.")


@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=["testserver"])
class DeleteCommentViewTest(TestCase):
    def setUp(self):
        self.alice = User.objects.create_user("alice", "alice@example.com", "pw")
        self.bob = User.objects.create_user("bob", "bob@example.com", "pw")
        self.post = BlogPost.objects.create(
            title="Post", slug="post", author="A", created_at=AT, updated_at=AT
        )
        self.comment = Comment.objects.create(
            target=self.post, user=self.alice, body="mine"
        )
        self.url = reverse("comments:delete", args=[self.comment.pk])

    def test_an_author_of_the_comment_can_delete_it(self):
        self.client.force_login(self.alice)

        self.client.post(self.url, {"next": "/blog/post/"})

        self.comment.refresh_from_db()
        self.assertTrue(self.comment.is_deleted)

    def test_deletion_is_soft_so_replies_survive(self):
        Comment.objects.create(
            target=self.post, user=self.bob, body="reply", reply_to=self.comment
        )
        self.client.force_login(self.alice)

        self.client.post(self.url, {"next": "/blog/post/"})

        self.assertEqual(Comment.objects.count(), 2)
        self.assertEqual(self.comment.replies.count(), 1)

    def test_another_user_cannot_delete_it(self):
        self.client.force_login(self.bob)

        self.client.post(self.url, {"next": "/blog/post/"})

        self.comment.refresh_from_db()
        self.assertFalse(self.comment.is_deleted)

    def test_the_site_author_can_delete_any_comment(self):
        self.bob.userprofile.is_author = True
        self.bob.userprofile.save()
        self.client.force_login(self.bob)

        self.client.post(self.url, {"next": "/blog/post/"})

        self.comment.refresh_from_db()
        self.assertTrue(self.comment.is_deleted)

    def test_a_signed_out_user_cannot_delete(self):
        self.client.post(self.url, {"next": "/blog/post/"})

        self.comment.refresh_from_db()
        self.assertFalse(self.comment.is_deleted)
