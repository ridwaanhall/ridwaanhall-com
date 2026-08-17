"""Employment and work-arrangement values come from one fixed vocabulary.

Four places describe the same two things, and only two of them were
constrained. Experience stored free text, and the open-to-work lists were
edited as free text, so "Fulltime" could sit beside "Full-time" and nothing
would notice until a page rendered oddly.

SECURE_SSL_REDIRECT is forced off because it is tied to ``not DEBUG`` and CI
runs with DEBUG=False, where every request would 301 before reaching the view.
"""

import re
from datetime import date

from django.contrib.auth.models import User
from django.test import TestCase, override_settings

from apps.about.models import Application, Experience, Organization
from apps.core.admin_widgets import ChoiceListField
from apps.core.choices import EMPLOYMENT_TYPE_CHOICES, LOCATION_TYPE_CHOICES
from apps.openhire.models import OpenToWorkProfile, Position


class SharedVocabularyTest(TestCase):
    def test_application_and_experience_share_one_list(self):
        """They were separate copies kept aligned by hand."""
        self.assertEqual(Application.EMPLOYMENT_TYPE_CHOICES, EMPLOYMENT_TYPE_CHOICES)
        self.assertEqual(Application.LOCATION_TYPE_CHOICES, LOCATION_TYPE_CHOICES)

    def test_experience_columns_carry_the_choices(self):
        employment = Experience._meta.get_field("employment_type")
        location = Experience._meta.get_field("location_type")

        self.assertEqual(list(employment.choices), EMPLOYMENT_TYPE_CHOICES)
        self.assertEqual(list(location.choices), LOCATION_TYPE_CHOICES)

    def test_position_type_carries_them_too(self):
        self.assertEqual(list(Position._meta.get_field("type").choices),
                         EMPLOYMENT_TYPE_CHOICES)

    def test_a_value_outside_the_vocabulary_fails_validation(self):
        org = Organization.objects.create(name="Acme")
        experience = Experience(
            title="Dev", organization=org, period_start=date(2024, 1, 1),
            employment_type="Fulltime",  # the drift this exists to prevent
            location_type="Remote", location="Remote", sort_order=0,
        )

        from django.core.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            experience.full_clean()


class ChoiceListFieldTest(TestCase):
    """The JSON list columns cannot carry `choices`, so the form does it."""

    def setUp(self):
        self.field = ChoiceListField(choices=LOCATION_TYPE_CHOICES)

    def test_it_returns_a_list_of_strings(self):
        self.assertEqual(self.field.clean(["Remote", "Hybrid"]), ["Remote", "Hybrid"])

    def test_it_rejects_a_value_outside_the_vocabulary(self):
        from django.core.exceptions import ValidationError

        with self.assertRaises(ValidationError):
            self.field.clean(["remote"])

    def test_an_empty_selection_is_allowed(self):
        self.assertEqual(self.field.clean([]), [])

    def test_a_null_column_renders_as_nothing_selected(self):
        self.assertEqual(self.field.prepare_value(None), [])

    def test_a_lone_string_is_not_split_into_characters(self):
        """A column holding "Remote" rather than ["Remote"] would otherwise
        render one checked box per letter."""
        self.assertEqual(self.field.prepare_value("Remote"), ["Remote"])

    def test_none_and_empty_are_not_a_change(self):
        self.assertFalse(self.field.has_changed(None, []))
        self.assertFalse(self.field.has_changed([], []))

    def test_reordering_counts_as_a_change(self):
        """jsonb preserves array order, so the order is real data."""
        self.assertTrue(self.field.has_changed(["Remote", "Hybrid"], ["Hybrid", "Remote"]))


@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=["testserver"])
class AdminRenderingTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_superuser("root", "root@example.com", "pw")
        self.client.force_login(self.user)

    def test_experience_offers_dropdowns_not_free_text(self):
        org = Organization.objects.create(name="Acme")
        experience = Experience.objects.create(
            title="Dev", organization=org, period_start=date(2024, 1, 1),
            employment_type="Full-time", location_type="Remote",
            location="Remote", sort_order=0,
        )

        html = self.client.get(f"/admin/about/experience/{experience.pk}/change/").content.decode()

        for name in ("employment_type", "location_type"):
            with self.subTest(field=name):
                self.assertRegex(html, rf'<select[^>]*name="{name}"')

    def test_open_to_work_offers_checkboxes(self):
        profile = OpenToWorkProfile.load()
        profile.type = ["Full-time", "Contract"]
        profile.location_types = ["Remote"]
        profile.save()

        html = self.client.get(
            f"/admin/openhire/opentoworkprofile/{profile.pk}/change/"
        ).content.decode()

        offered = re.findall(r'name="type"[^>]*value="([^"]+)"', html)
        self.assertEqual(offered, [value for value, _ in EMPLOYMENT_TYPE_CHOICES])
        self.assertIn('name="location_types"', html)
        self.assertIn('type="checkbox"', html)

    def test_saving_the_form_keeps_the_stored_shape(self):
        """The column stays a list of strings; only the editor changed."""
        profile = OpenToWorkProfile.load()
        profile.type = ["Full-time"]
        profile.location_types = ["Remote"]
        profile.save()

        profile.refresh_from_db()

        self.assertEqual(profile.type, ["Full-time"])
        self.assertIsInstance(profile.type, list)
        self.assertTrue(all(isinstance(v, str) for v in profile.type))
