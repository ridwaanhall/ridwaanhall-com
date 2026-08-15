"""PrivacyPolicy model and singleton behaviour."""

from django.test import TestCase


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
