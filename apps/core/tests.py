from django.test import TestCase, override_settings

from apps.core.types import PrivacyPolicyModel
from apps.core.data_service import DataService
from apps.core.email_handler import _get_owner_emails


class CoreTypesTest(TestCase):
    """Tests for OOP type classes in apps/core/types/."""

    def test_privacy_policy_model_to_dict(self):
        from datetime import datetime, timezone
        model = PrivacyPolicyModel(
            last_updated=datetime(2025, 1, 1, tzinfo=timezone.utc),
            overview="This is an overview.",
            policy_updates="We update our policy regularly.",
        )
        d = model.to_dict()
        self.assertEqual(d["overview"], "This is an overview.")
        self.assertEqual(d["policy_updates"], "We update our policy regularly.")

    def test_privacy_policy_model_defaults(self):
        from datetime import datetime, timezone
        model = PrivacyPolicyModel(
            last_updated=datetime(2025, 1, 1, tzinfo=timezone.utc),
            overview="overview",
            policy_updates="updates",
        )
        self.assertEqual(model.data_collected, {})
        self.assertEqual(model.user_rights, {})
        self.assertEqual(model.cookies, {})


class CoreDataServiceTest(TestCase):
    """Tests that DataService correctly loads privacy data from apps/core/data/."""

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

