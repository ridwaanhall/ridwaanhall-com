from django.test import TestCase

from apps.core.types import PrivacyPolicyModel
from apps.core.data_service import DataService


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

