"""Comment sections report what happened, on both surfaces.

The blog and the project detail pages mount the same section, and the wording
has to match the guestbook's -- to a reader they are the same feature, and
saying "Comment posted." in one place and nothing at all in another is what
this covers.

Comments post-then-redirect rather than going over AJAX, so their feedback
travels through django.contrib.messages and lands in the shared toast stack on
the next page. That is a different mechanism from the guestbook's JSON
`notice`, and these pin that it still reaches the screen.

SECURE_SSL_REDIRECT is forced off because it is tied to ``not DEBUG``, and CI
runs with DEBUG=False, where every request would 301 before reaching the view.
"""

from datetime import UTC, datetime

from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase, override_settings

from apps.about.models import Profile
from apps.blog.models import BlogPost
from apps.comments.models import Comment
from apps.projects.models import Project

AT = datetime(2026, 1, 1, tzinfo=UTC)


@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=["testserver"])
class CommentFeedbackTest(TestCase):
    def setUp(self):
        Profile.objects.create(name="Me")
        self.post = BlogPost.objects.create(
            title="Post", slug="post", author="A", created_at=AT, updated_at=AT
        )
        self.project = Project.objects.create(
            title="Proj", slug="proj", created_at=AT, updated_at=AT
        )
        self.user = User.objects.create_user("alice", "alice@example.com", "pw")

    def targets(self):
        return [
            ("blog.blogpost", self.post.pk, "/blog/post/"),
            ("projects.project", self.project.pk, "/projects/proj/"),
        ]

    def test_posting_is_confirmed_in_the_shared_toast_stack_on_both_surfaces(self):
        self.client.force_login(self.user)

        for label, object_id, path in self.targets():
            with self.subTest(target=label):
                response = self.client.post(
                    "/comments/post/",
                    {
                        "content_type": label,
                        "object_id": object_id,
                        "body": "a comment worth posting",
                        "next": f"{path}#comments",
                    },
                    follow=True,
                )

                html = response.content.decode()
                self.assertIn('id="notifications"', html)
                self.assertIn("Comment posted.", html)
                self.assertIn("border-green-700", html)

    def test_a_reply_is_worded_as_a_reply_matching_the_guestbook(self):
        self.client.force_login(self.user)
        parent = Comment.objects.create(
            content_type=ContentType.objects.get_for_model(BlogPost),
            object_id=self.post.pk,
            user=self.user,
            body="parent",
        )

        response = self.client.post(
            "/comments/post/",
            {
                "content_type": "blog.blogpost",
                "object_id": self.post.pk,
                "body": "a reply worth posting",
                "reply_to": parent.pk,
                "next": "/blog/post/#comments",
            },
            follow=True,
        )

        self.assertContains(response, "Reply posted.")

    def test_deleting_is_confirmed(self):
        self.client.force_login(self.user)
        comment = Comment.objects.create(
            content_type=ContentType.objects.get_for_model(BlogPost),
            object_id=self.post.pk,
            user=self.user,
            body="delete me",
        )

        response = self.client.post(
            f"/comments/{comment.pk}/delete/",
            {"next": "/blog/post/#comments"},
            follow=True,
        )

        self.assertContains(response, "Comment deleted.")
        self.assertIn("border-green-700", response.content.decode())

    def test_a_refused_post_is_reported_as_an_error_not_silently_dropped(self):
        self.client.force_login(self.user)

        response = self.client.post(
            "/comments/post/",
            {
                "content_type": "blog.blogpost",
                "object_id": self.post.pk,
                "body": "",
                "next": "/blog/post/#comments",
            },
            follow=True,
        )

        self.assertIn("border-red-700", response.content.decode())

    def test_both_surfaces_return_the_reader_to_the_thread(self):
        """Not the top of the article. The toast is fixed-position and visible
        either way, but landing at the masthead leaves you hunting for what you
        just wrote."""
        self.client.force_login(self.user)

        for path in ("/blog/post/", "/projects/proj/"):
            with self.subTest(path=path):
                html = self.client.get(path).content.decode()
                self.assertIn(f'value="{path}#comments"', html)
