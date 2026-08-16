"""Signing out of the guestbook asks first.

SECURE_SSL_REDIRECT is forced off because it is tied to ``not DEBUG``, and CI
runs with DEBUG=False, where every request would 301 before reaching the view.
"""

from django.contrib.auth.models import User
from django.test import TestCase, override_settings

from apps.about.models import Profile


@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=["testserver"])
class GuestbookSignOutTest(TestCase):
    def setUp(self):
        Profile.objects.create(name="Me")
        self.user = User.objects.create_user("alice", "alice@example.com", "pw")

    def test_sign_out_routes_through_the_confirm_dialog(self):
        """It used to be a bare submit button, so a stray click ended the
        session with no way back other than signing in again."""
        self.client.force_login(self.user)

        html = self.client.get("/guestbook/").content.decode()

        self.assertIn("Sign Out", html)
        self.assertIn('data-confirm-title="Sign out?"', html)
        self.assertIn('data-confirm-action="/guestbook/accounts/logout/"', html)

    def test_the_sign_out_control_no_longer_posts_directly(self):
        self.client.force_login(self.user)

        html = self.client.get("/guestbook/").content.decode()

        self.assertNotIn('action="/guestbook/accounts/logout/" class="inline"', html)

    def test_the_shared_dialog_is_available_on_the_guestbook(self):
        self.client.force_login(self.user)

        html = self.client.get("/guestbook/").content.decode()

        self.assertIn('id="confirm-dialog"', html)
        self.assertIn("js/confirmDialog.js", html)

    def test_signed_out_visitors_see_no_sign_out_control(self):
        html = self.client.get("/guestbook/").content.decode()
        self.assertNotIn('data-confirm-title="Sign out?"', html)
