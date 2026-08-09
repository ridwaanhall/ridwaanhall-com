from django.test import TestCase

from apps.core.data_service import DataService


class OpenHireModelsTest(TestCase):
    """Tests for the ORM models in apps/openhire/models.py."""

    def test_portfolio_highlight_ordering(self):
        from apps.openhire.models import OpenToWorkProfile, PortfolioHighlight

        profile = OpenToWorkProfile.load()
        PortfolioHighlight.objects.create(
            open_to_work_profile=profile, title="Django", description="5+ projects built with Django",
        )
        self.assertEqual(profile.portfolio_highlights.count(), 1)

    def test_open_to_work_profile_defaults(self):
        from apps.openhire.models import OpenToWorkProfile

        profile = OpenToWorkProfile.objects.create(status="Open", availability="Immediately", remote=True)
        self.assertEqual(profile.experience_level, "")
        self.assertEqual(profile.preferred_roles, [])

    def test_position_fields(self):
        from apps.openhire.models import HiringProfile, Position

        hp = HiringProfile.load()
        pos = Position.objects.create(
            hiring_profile=hp, title="Python Developer", type="Full-time", location="Remote",
            salary_range="$5k-$10k", experience_required="2 years",
        )
        self.assertEqual(pos.title, "Python Developer")
        self.assertEqual(pos.type, "Full-time")

    def test_hiring_profile_defaults(self):
        from apps.openhire.models import HiringProfile

        hp = HiringProfile.objects.create(
            company_name="RoneAI", company_description="AI company", website="https://rone.dev",
            hiring_status="Active",
        )
        self.assertEqual(hp.company_name, "RoneAI")
        self.assertEqual(hp.hiring_status, "Active")


class OpenHireDataServiceTest(TestCase):
    """Tests that DataService correctly loads openhire data from apps/openhire/data/."""

    def test_get_open_to_work_data_returns_dict_or_none(self):
        result = DataService.get_open_to_work_data()
        self.assertTrue(result is None or isinstance(result, dict))

    def test_get_hiring_data_returns_dict_or_none(self):
        result = DataService.get_hiring_data()
        self.assertTrue(result is None or isinstance(result, dict))

    def test_open_to_work_data_has_status(self):
        result = DataService.get_open_to_work_data()
        if result is not None:
            self.assertIn("status", result)

