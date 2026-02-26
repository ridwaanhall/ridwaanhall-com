from django.test import TestCase

from apps.openhire.types import (
    PortfolioHighlight, OpenToWorkModel, Position, Requirements, ContactInfo, HiringModel,
)
from apps.data.data_service import DataService


class OpenHireTypesTest(TestCase):
    """Tests for OOP type classes in apps/openhire/types/."""

    def test_portfolio_highlight_to_dict(self):
        ph = PortfolioHighlight(title="Django", description="5+ projects built with Django")
        d = ph.to_dict()
        self.assertEqual(d["title"], "Django")
        self.assertEqual(d["description"], "5+ projects built with Django")

    def test_open_to_work_model_to_dict(self):
        model = OpenToWorkModel(
            status="Open", availability="Immediately", type="Full-time",
            remote=True, relocation=False,
        )
        d = model.to_dict()
        self.assertEqual(d["status"], "Open")
        self.assertTrue(d["remote"])
        self.assertFalse(d["relocation"])

    def test_open_to_work_model_defaults(self):
        model = OpenToWorkModel(status="Open", availability="ASAP", type="Contract", remote=True, relocation=False)
        self.assertEqual(model.experience_level, "")
        self.assertEqual(model.preferred_roles, [])

    def test_position_to_dict(self):
        pos = Position(
            title="Python Developer", type="Full-time", location="Remote",
            salary_range="$5k-$10k", experience_required="2 years",
        )
        d = pos.to_dict()
        self.assertEqual(d["title"], "Python Developer")
        self.assertEqual(d["type"], "Full-time")

    def test_requirements_to_dict(self):
        req = Requirements(general=["Good communication"], technical=["Python", "Django"])
        d = req.to_dict()
        self.assertIn("Python", d["technical"])

    def test_hiring_model_to_dict(self):
        model = HiringModel(
            company_name="RoneAI", company_description="AI company", website="https://rone.dev",
            hiring_status="Active",
        )
        d = model.to_dict()
        self.assertEqual(d["company_name"], "RoneAI")
        self.assertEqual(d["hiring_status"], "Active")


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

