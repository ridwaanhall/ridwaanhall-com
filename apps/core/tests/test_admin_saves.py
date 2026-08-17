"""End-to-end admin saves for JSON-backed fields."""

import json
from datetime import date

from django.test import TestCase, override_settings


class AdminJSONFieldSaveTest(TestCase):
    """End-to-end admin saves for the two bugs the widget work uncovered.

    Both only reproduce through a real request cycle, which is why they are
    here rather than in the field-level round-trip tests above.
    """

    @classmethod
    def setUpTestData(cls):
        from django.contrib.auth.models import User

        from apps.about.models import Experience

        cls.user = User.objects.create_superuser(
            username="admin-test", email="a@example.com", password="pw",
        )
        cls.experience = Experience.objects.create(
            title="Dev", company="Acme",
            period_start=date(2024, 1, 1),
            employment_type="Full-time", location_type="Remote", location="Remote",
            is_current=True, sort_order=0,
            responsibilities=["Ship things", "Fix things"],
        )

    def setUp(self):
        self.client.force_login(self.user)

    def _experience_payload(self, **overrides):
        payload = {
            "title": self.experience.title,
            "company": self.experience.company,
            "website": "",
            "period_start": self.experience.period_start.isoformat(),
            "period_end": "",
            "employment_type": self.experience.employment_type,
            "location_type": self.experience.location_type,
            "location": self.experience.location,
            "is_current": "on",
            "responsibilities": json.dumps(self.experience.responsibilities),
            "sort_order": self.experience.sort_order,
        }
        payload.update(overrides)
        return payload

    @override_settings(SECURE_SSL_REDIRECT=False)
    def test_clearing_a_json_field_saves_an_empty_list(self):
        """Regression: this used to raise IntegrityError.

        forms.JSONField.to_python() returns None for empty input and none of
        these columns are nullable, so emptying any of them in admin blew up
        with a NOT NULL violation.
        """
        url = f"/admin/about/experience/{self.experience.pk}/change/"
        response = self.client.post(url, self._experience_payload(responsibilities=""))

        self.assertEqual(response.status_code, 302)
        self.experience.refresh_from_db()
        self.assertEqual(self.experience.responsibilities, [])

    @override_settings(SECURE_SSL_REDIRECT=False)
    def test_editing_a_json_field_persists(self):
        url = f"/admin/about/experience/{self.experience.pk}/change/"
        response = self.client.post(
            url, self._experience_payload(responsibilities=json.dumps(["Only this"]))
        )

        self.assertEqual(response.status_code, 302)
        self.experience.refresh_from_db()
        self.assertEqual(self.experience.responsibilities, ["Only this"])

    @override_settings(SECURE_SSL_REDIRECT=False)
    def test_blank_extra_inline_row_does_not_block_saving(self):
        """Regression: the blank "add another" Position row counted as changed.

        Django then fully validated that empty row and rejected the whole page
        for missing required fields, so HiringProfile could never be saved.
        """
        from apps.openhire.models import HiringProfile

        profile = HiringProfile.load()
        url = f"/admin/openhire/hiringprofile/{profile.pk}/change/"
        payload = {
            "company_name": "Acme",
            "company_description": "",
            "website": "",
            "hiring_status": "Active",
            "application_process": json.dumps(["Apply"]),
            "company_culture": "",
            "requirements_general": "",
            "requirements_technical": "",
            "contact_email": "",
            "contact_application_email": "",
            "contact_response_time": "",
            "contact_interview_process": "",
            "additional_notes": "",
            # One untouched extra inline row, exactly as the admin renders it:
            # every text input empty, and `order` carrying the model default
            # that the widget shows (value="0"), not an empty string.
            "positions-TOTAL_FORMS": "1",
            "positions-INITIAL_FORMS": "0",
            "positions-MIN_NUM_FORMS": "0",
            "positions-MAX_NUM_FORMS": "1000",
            "positions-0-id": "",
            "positions-0-title": "",
            "positions-0-type": "",
            "positions-0-location": "",
            "positions-0-salary_range": "",
            "positions-0-experience_required": "",
            "positions-0-skills_required": "",
            "positions-0-responsibilities": "",
            "positions-0-benefits": "",
            "positions-0-order": "0",
        }
        response = self.client.post(url, payload)

        self.assertEqual(response.status_code, 302, "the blank inline row blocked the save")
        profile.refresh_from_db()
        self.assertEqual(profile.company_name, "Acme")
        self.assertEqual(profile.positions.count(), 0, "a blank row should not create a Position")
