"""DataService's privacy-policy accessors."""

from django.test import TestCase

from apps.core.data_service import DataService


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


def _roundtrip(field, value):
    """Push a stored value through render -> submit -> clean, as admin would."""
    return field.clean(field.prepare_value(value))
