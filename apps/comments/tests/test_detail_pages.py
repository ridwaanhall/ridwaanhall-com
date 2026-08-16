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

    # -- confirmation dialog ----------------------------------------------

    def test_deleting_goes_through_a_confirmation_dialog(self):
        """Delete must not fire straight from the thread -- the button only
        carries data for the shared dialog, which holds the posting form."""
        Comment.objects.create(target=self.post, user=self.user, body="mine")
        self.client.force_login(self.user)

        html = self.client.get("/blog/post/").content.decode()

        self.assertIn('data-confirm-action="/comments/', html)
        self.assertIn('data-confirm-title="Delete this comment?"', html)
        self.assertIn('data-confirm-variant="danger"', html)
        # The button itself posts nothing; the one dialog form does.
        self.assertEqual(html.count('id="confirm-dialog-form"'), 1)

    def test_the_dialog_is_hidden_until_asked_for(self):
        html = self.client.get("/blog/post/").content.decode()

        modal = html.split('id="confirm-dialog"')[1].split(">")[0]
        self.assertIn("hidden", modal)
        self.assertIn('aria-hidden="true"', modal)

    def test_the_dialog_reuses_the_shared_modal_contract(self):
        """Driven by modalDialog.js, the same helper the sidebar search modal
        uses, so it must carry the class hooks that helper toggles -- otherwise
        it opens with no animation and never blurs the backdrop."""
        html = self.client.get("/blog/post/").content.decode()

        self.assertIn("backdrop-blur-none", html)
        self.assertIn('id="confirm-dialog-backdrop"', html)
        self.assertIn('id="confirm-dialog-content"', html)
        self.assertIn("scale-95", html)

    def test_the_dialog_is_page_level_not_part_of_the_comment_section(self):
        """It has to live outside #page-content: that element carries a
        transform, which makes it the containing block for position:fixed
        descendants, so a dialog inside it would blur the content column and
        leave the sidebar sharp. Rendering on a page with no comments at all
        is what proves it is page-level."""
        html = self.client.get("/about/").content.decode()

        self.assertIn('id="confirm-dialog"', html)
        self.assertNotIn("comments/_section", html)

    def test_the_shared_helpers_load_in_dependency_order(self):
        html = self.client.get("/blog/post/").content.decode()

        for asset in ("js/modalDialog.js", "js/confirmDialog.js", "js/commentSection.js"):
            self.assertIn(asset, html)
        self.assertLess(
            html.index("js/modalDialog.js"),
            html.index("js/confirmDialog.js"),
            "modalDialog.js must load first or ModalDialog is undefined",
        )

    def test_the_comment_script_is_not_inlined(self):
        """It lives in staticfiles/js like the rest of the site's behaviour."""
        html = self.client.get("/blog/post/").content.decode()
        self.assertNotIn("comment-reply-btn\").forEach", html)

    # -- sign out ----------------------------------------------------------

    def test_a_signed_in_reader_can_sign_out_from_the_comment_section(self):
        self.client.force_login(self.user)

        html = self.client.get("/blog/post/").content.decode()

        self.assertIn("Sign out", html)
        self.assertIn('data-confirm-title="Sign out?"', html)
        self.assertIn('data-confirm-action="/guestbook/accounts/logout/"', html)

    def test_signing_out_asks_first(self):
        """Same dialog as delete -- a stray click must not end the session."""
        self.client.force_login(self.user)

        html = self.client.get("/blog/post/").content.decode()

        signout = [line for line in html.splitlines() if 'data-confirm-title="Sign out?"' in line]
        self.assertTrue(signout, "sign out should route through the confirm dialog")

    def test_signed_out_readers_get_no_sign_out_control(self):
        html = self.client.get("/blog/post/").content.decode()
        self.assertNotIn('data-confirm-title="Sign out?"', html)

    def test_the_project_page_offers_sign_out_too(self):
        self.client.force_login(self.user)
        html = self.client.get("/projects/proj/").content.decode()
        self.assertIn('data-confirm-title="Sign out?"', html)

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
