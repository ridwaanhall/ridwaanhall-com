"""Recipient parsing for outgoing mail."""

from django.test import TestCase, override_settings

from apps.core.email_handler import _get_owner_emails


class CoreEmailHandlerTest(TestCase):
    """Tests for email handler helpers."""

    @override_settings(CONTACT_EMAIL_RECIPIENT="Ridwan <Hi@Ridwaanhall.com>")
    def test_owner_emails_normalize_display_name(self):
        self.assertEqual(_get_owner_emails(), ["hi@ridwaanhall.com"])

    @override_settings(CONTACT_EMAIL_RECIPIENT="Owner <a@example.com>, b@example.com")
    def test_owner_emails_csv(self):
        self.assertEqual(_get_owner_emails(), ["a@example.com", "b@example.com"])

    @override_settings(CONTACT_EMAIL_RECIPIENT=["Alice <A@Example.com>", "B@example.com"])
    def test_owner_emails_iterable(self):
        self.assertEqual(_get_owner_emails(), ["a@example.com", "b@example.com"])

    @override_settings(CONTACT_EMAIL_RECIPIENT=None, DEFAULT_FROM_EMAIL="Site <Owner@Example.com>")
    def test_owner_emails_fallback_default_from(self):
        self.assertEqual(_get_owner_emails(), ["owner@example.com"])
