"""The comment section as it appears on blog and project detail pages.

Covers the two things a user actually sees: signed out, an HTML sign-in prompt
rather than a form; signed in, the form. Plus the cache isolation that keeps
commenting cheap.
"""

from datetime import UTC, datetime

from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import TestCase, override_settings

from apps.about.models import Profile
from apps.blog.models import BlogPost
from apps.comments.models import Comment
from apps.core.models import ContentVersion
from apps.projects.models import Project

AT = datetime(2026, 1, 1, tzinfo=UTC)


@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=["testserver"])
class CommentSectionRenderingTest(TestCase):
    def setUp(self):
        Profile.objects.create(name="Me")
        self.post = BlogPost.objects.create(
            title="Post", slug="post", author="A", created_at=AT, updated_at=AT
        )
        self.project = Project.objects.create(
            title="Proj", slug="proj", created_at=AT, updated_at=AT
        )
        self.user = User.objects.create_user("alice", "alice@example.com", "pw")

    # -- signed out --------------------------------------------------------

    def test_signed_out_blog_page_shows_the_sign_in_prompt(self):
        response = self.client.get("/blog/post/")

        self.assertContains(response, "Sign in to join the conversation")
        self.assertContains(response, "Sign in with Google")
        self.assertContains(response, "Sign in with GitHub")

    def test_signed_out_project_page_shows_the_sign_in_prompt(self):
        response = self.client.get("/projects/proj/")
        self.assertContains(response, "Sign in with GitHub")

    def test_signed_out_pages_show_no_comment_form(self):
        response = self.client.get("/blog/post/")
        self.assertNotContains(response, 'id="comment-form"')

    def test_the_prompt_is_real_html_not_a_script_notification(self):
        """The requirement is an in-page HTML prompt, so assert the markup is
        server-rendered rather than produced by an alert()/Notification call."""
        html = self.client.get("/blog/post/").content.decode()

        # allauth is mounted under the guestbook prefix, so match the tail.
        self.assertIn("accounts/google/login/", html)
        self.assertIn("accounts/github/login/", html)
        self.assertNotIn("alert(", html)
        self.assertNotIn("new Notification", html)

    # -- signed in ---------------------------------------------------------

    def test_signed_in_blog_page_shows_the_form(self):
        self.client.force_login(self.user)

        response = self.client.get("/blog/post/")

        self.assertContains(response, 'id="comment-form"')
        self.assertNotContains(response, "Sign in with Google")

    def test_signed_in_project_page_shows_the_form(self):
        self.client.force_login(self.user)
        response = self.client.get("/projects/proj/")
        self.assertContains(response, 'id="comment-form"')

    # -- content -----------------------------------------------------------

    def test_existing_comments_render(self):
        Comment.objects.create(target=self.post, user=self.user, body="First!")
        response = self.client.get("/blog/post/")
        self.assertContains(response, "First!")

    def test_a_reply_renders_under_its_parent(self):
        parent = Comment.objects.create(target=self.post, user=self.user, body="top")
        Comment.objects.create(
            target=self.post, user=self.user, body="a reply", reply_to=parent
        )

        response = self.client.get("/blog/post/")

        self.assertContains(response, "top")
        self.assertContains(response, "a reply")

    def test_a_deleted_comment_shows_a_tombstone(self):
        Comment.objects.create(
            target=self.post, user=self.user, body="oops", is_deleted=True
        )

        response = self.client.get("/blog/post/")

        self.assertContains(response, "This comment was deleted.")
        self.assertNotContains(response, "oops")

    def test_comments_do_not_leak_between_a_post_and_a_project(self):
        Comment.objects.create(target=self.post, user=self.user, body="blog-only")

        response = self.client.get("/projects/proj/")

        self.assertNotContains(response, "blog-only")

    # -- delete confirmation ----------------------------------------------

    def test_deleting_goes_through_a_confirmation_dialog(self):
        """Delete must not fire straight from the thread -- the button opens a
        centred dialog and only that dialog holds the posting form."""
        Comment.objects.create(target=self.post, user=self.user, body="mine")
        self.client.force_login(self.user)

        html = self.client.get("/blog/post/").content.decode()

        self.assertIn('id="comment-delete-modal"', html)
        self.assertIn('role="dialog"', html)
        self.assertIn('aria-modal="true"', html)
        self.assertIn("Delete this comment?", html)
        # Centred over the viewport rather than inline in the thread.
        self.assertIn("fixed inset-0", html)
        self.assertIn("items-center justify-center", html)

    def test_the_dialog_is_hidden_until_asked_for(self):
        Comment.objects.create(target=self.post, user=self.user, body="mine")
        self.client.force_login(self.user)

        html = self.client.get("/blog/post/").content.decode()

        modal = html.split('id="comment-delete-modal"')[1].split(">")[0]
        self.assertIn("hidden", modal)
        self.assertIn('aria-hidden="true"', modal)

    def test_the_dialog_reuses_the_shared_modal_contract(self):
        """It is driven by modalDialog.js, the same helper the sidebar search
        modal uses, so it has to carry the class hooks that helper toggles --
        otherwise it would open with no animation and never blur the backdrop."""
        Comment.objects.create(target=self.post, user=self.user, body="mine")
        self.client.force_login(self.user)

        html = self.client.get("/blog/post/").content.decode()

        self.assertIn("backdrop-blur-none", html)
        self.assertIn('id="comment-delete-backdrop"', html)
        self.assertIn('id="comment-delete-content"', html)
        # The panel starts collapsed; the helper swaps these for scale-100/opacity-100.
        self.assertIn("scale-95", html)
        self.assertIn("opacity-0", html)

    def test_the_shared_modal_helper_loads_before_anything_using_it(self):
        html = self.client.get("/blog/post/").content.decode()

        self.assertIn("js/modalDialog.js", html)
        self.assertIn("js/commentSection.js", html)
        self.assertLess(
            html.index("js/modalDialog.js"),
            html.index("js/commentSection.js"),
            "modalDialog.js must load first or ModalDialog is undefined",
        )

    def test_the_comment_script_is_not_inlined(self):
        """It lives in staticfiles/js like the rest of the site's behaviour."""
        html = self.client.get("/blog/post/").content.decode()
        self.assertNotIn("comment-reply-btn\").forEach", html)

    def test_delete_buttons_only_carry_a_url_not_their_own_form(self):
        """One dialog for the page: the buttons hand it a URL, so there is no
        per-comment form duplicated down the thread."""
        Comment.objects.create(target=self.post, user=self.user, body="mine")
        self.client.force_login(self.user)

        html = self.client.get("/blog/post/").content.decode()

        self.assertIn("comment-delete-btn", html)
        self.assertIn("data-delete-url=", html)
        self.assertEqual(html.count('id="comment-delete-form"'), 1)

    def test_no_dialog_is_rendered_when_nothing_is_deletable(self):
        Comment.objects.create(target=self.post, user=self.user, body="theirs")
        # Signed out: nothing is deletable, so the dialog is pointless markup.
        html = self.client.get("/blog/post/").content.decode()

        self.assertNotIn('id="comment-delete-modal"', html)

    # -- reply tree --------------------------------------------------------

    def test_replies_are_drawn_as_a_tree(self):
        """Replies hang off a connector rail rather than sitting in a flat list."""
        parent = Comment.objects.create(target=self.post, user=self.user, body="top")
        Comment.objects.create(
            target=self.post, user=self.user, body="reply one", reply_to=parent
        )

        html = self.client.get("/blog/post/").content.decode()

        self.assertIn("before:left-[1.125rem]", html, "reply rail missing")
        self.assertIn("after:top-4", html, "elbow into the avatar missing")

    def test_the_last_reply_ends_the_rail(self):
        """A rail running past the final reply looks broken, so the last one
        draws a stub instead of a full-height line."""
        parent = Comment.objects.create(target=self.post, user=self.user, body="top")
        Comment.objects.create(target=self.post, user=self.user, body="a", reply_to=parent)
        Comment.objects.create(target=self.post, user=self.user, body="b", reply_to=parent)

        html = self.client.get("/blog/post/").content.decode()

        self.assertIn("before:bottom-[-0.75rem]", html, "continuing rail missing")
        self.assertIn("before:h-4", html, "terminating stub missing")

    def test_a_thread_without_replies_draws_no_rail(self):
        Comment.objects.create(target=self.post, user=self.user, body="lonely")

        html = self.client.get("/blog/post/").content.decode()

        self.assertNotIn("before:left-[1.125rem]", html)

    def test_the_count_reflects_comments_and_replies(self):
        parent = Comment.objects.create(target=self.post, user=self.user, body="a")
        Comment.objects.create(target=self.post, user=self.user, body="b", reply_to=parent)

        self.assertContains(self.client.get("/blog/post/"), "2 comments")


@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=["testserver"],
                   CONTENT_CACHE_ENABLED=True, CONTENT_CACHE_VERSION_TTL=60)
class CommentCacheIsolationTest(TestCase):
    """Comments must stay out of the content cache namespaces.

    If Comment were mapped into MODEL_NAMESPACES, every comment posted would
    orphan the blog or project payload and force a full rebuild from Supabase --
    making the cheapest write on the site the most expensive one, on its busiest
    pages.
    """

    def setUp(self):
        cache.clear()
        self.addCleanup(cache.clear)
        Profile.objects.create(name="Me")
        self.post = BlogPost.objects.create(
            title="Post", slug="post", author="A", created_at=AT, updated_at=AT
        )
        self.user = User.objects.create_user("alice", "alice@example.com", "pw")

    def test_posting_a_comment_does_not_bump_any_content_version(self):
        from apps.core.content_manager import ContentManager

        ContentManager.get_blogs()  # warm
        before = dict(ContentVersion.objects.values_list("namespace", "version"))

        Comment.objects.create(target=self.post, user=self.user, body="hi")

        after = dict(ContentVersion.objects.values_list("namespace", "version"))
        self.assertEqual(after, before)

    def test_comment_is_not_registered_as_a_cached_model(self):
        from apps.core.cache import MODEL_NAMESPACES

        self.assertNotIn("comments.Comment", MODEL_NAMESPACES)
