from django.test import TestCase, override_settings

from apps.core.data_service import DataService
from apps.core.email_handler import _get_owner_emails


class CoreModelsTest(TestCase):
    """Tests for the ORM models in apps/core/models.py."""

    def test_privacy_policy_defaults(self):
        from django.utils import timezone

        from apps.core.models import PrivacyPolicy

        policy = PrivacyPolicy.objects.create(
            last_updated=timezone.now(), overview="overview", policy_updates="updates",
        )
        self.assertEqual(policy.data_collected, {})
        self.assertEqual(policy.user_rights, {})
        self.assertEqual(policy.cookies, {})

    def test_privacy_policy_is_singleton(self):
        from apps.core.models import PrivacyPolicy

        first = PrivacyPolicy.load()
        second = PrivacyPolicy.load()
        self.assertEqual(first.pk, second.pk)
        self.assertEqual(PrivacyPolicy.objects.count(), 1)


class CoreDataServiceTest(TestCase):
    """Tests that DataService correctly loads privacy data (ORM-backed)."""

    @classmethod
    def setUpTestData(cls):
        from django.utils import timezone

        from apps.core.models import PrivacyPolicy

        PrivacyPolicy.objects.create(
            last_updated=timezone.now(), overview="This is an overview.",
            policy_updates="We update our policy regularly.",
        )

    def test_get_privacy_policy_returns_dict(self):
        result = DataService.get_privacy_policy()
        self.assertIsInstance(result, dict)

    def test_privacy_policy_has_overview(self):
        result = DataService.get_privacy_policy()
        self.assertIn("overview", result)
        self.assertIsInstance(result["overview"], str)

    def test_privacy_policy_has_last_updated(self):
        result = DataService.get_privacy_policy()
        self.assertIn("last_updated", result)


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

