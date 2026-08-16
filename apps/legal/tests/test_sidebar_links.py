"""Footer links in the sidebar: Privacy, Terms, and the superuser-only Admin.

SECURE_SSL_REDIRECT is forced off because it is tied to ``not DEBUG`` and CI
runs with DEBUG=False, where every request would 301 before reaching the view.
"""

from django.contrib.auth.models import User
from django.test import TestCase, override_settings

from apps.about.models import Profile


@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=["testserver"])
class SidebarFooterLinkTest(TestCase):
    def setUp(self):
        Profile.objects.create(name="Me")

    def test_everyone_gets_the_privacy_and_terms_links(self):
        html = self.client.get("/about/").content.decode()

        self.assertIn("/privacy-policy/", html)
        self.assertIn("/terms/", html)

    def test_anonymous_visitors_do_not_see_the_admin_link(self):
        html = self.client.get("/about/").content.decode()
        self.assertNotIn(">Admin<", html)

    def test_ordinary_signed_in_users_do_not_see_the_admin_link(self):
        """Staff-but-not-superuser included: the link is gated on is_superuser."""
        user = User.objects.create_user("alice", "alice@example.com", "pw", is_staff=True)
        self.client.force_login(user)

        html = self.client.get("/about/").content.decode()

        self.assertNotIn(">Admin<", html)

    def test_a_superuser_sees_the_admin_link(self):
        admin_user = User.objects.create_superuser("root", "root@example.com", "pw")
        self.client.force_login(admin_user)

        html = self.client.get("/about/").content.decode()

        self.assertIn(">Admin<", html)
        self.assertIn("/admin/", html)

    def test_the_link_appears_in_both_sidebar_copies(self):
        """The footer block is duplicated for the mobile menu and the desktop
        sidebar; a change made to only one of them shows on one breakpoint."""
        admin_user = User.objects.create_superuser("root", "root@example.com", "pw")
        self.client.force_login(admin_user)

        html = self.client.get("/about/").content.decode()

        self.assertEqual(html.count(">Admin<"), 2)
        self.assertEqual(html.count(">Terms</a>") + html.count(">Terms</span>"), 2)
