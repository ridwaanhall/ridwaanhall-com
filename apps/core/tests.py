import json

from django.core.exceptions import ValidationError
from django.test import TestCase, override_settings

from apps.core.admin_widgets import (
    ContentBlockField,
    CopyrightCreditsField,
    GroupedKeyValueField,
    KeyValueField,
    StringListField,
)
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


def _roundtrip(field, value):
    """Push a stored value through render -> submit -> clean, as admin would."""
    return field.clean(field.prepare_value(value))


class AdminJSONWidgetRoundTripTest(TestCase):
    """The structured admin editors must never alter the data they carry.

    Every case below uses a value shaped like the real production content --
    including the awkward ones (double spaces in class strings, raw HTML with
    newlines, list items that deliberately lack a `class` key).
    """

    def assertRoundTrips(self, field, value):
        self.assertEqual(
            json.dumps(_roundtrip(field, value), sort_keys=True, ensure_ascii=False),
            json.dumps(value, sort_keys=True, ensure_ascii=False),
        )

    # -- string lists ----------------------------------------------------

    def test_string_list_round_trips(self):
        self.assertRoundTrips(
            StringListField(required=False),
            ["Python", "Django", "TensorFlow"],
        )

    def test_string_list_preserves_html_and_emoji(self):
        self.assertRoundTrips(
            StringListField(required=False, multiline=True, allows_html=True),
            ["I am <strong>Ridwan</strong>.", "Let's build something.\U0001f680"],
        )

    def test_string_list_empty_input_is_empty_list_not_none(self):
        # forms.JSONField returns None here, which would hit a NOT NULL column.
        self.assertEqual(StringListField(required=False).clean(""), [])

    def test_string_list_rejects_non_string_entries(self):
        with self.assertRaises(ValidationError):
            StringListField(required=False).clean(json.dumps(["ok", 42]))

    # -- key/value -------------------------------------------------------

    def test_key_value_round_trips(self):
        self.assertRoundTrips(
            KeyValueField(required=False),
            {"Storage": "Data is stored securely.", "Retention": "Cache refreshes every 3 hours."},
        )

    def test_grouped_key_value_round_trips(self):
        self.assertRoundTrips(
            GroupedKeyValueField(required=False),
            {
                "Essential Cookies": {"SessionId": "Keeps you logged in.", "CsrfToken": "Blocks CSRF."},
                "Analytics Cookies": {"Google Analytics": "Aggregate usage stats."},
            },
        )

    def test_copyright_credits_round_trips(self):
        self.assertRoundTrips(
            CopyrightCreditsField(required=False),
            {
                "owner": "Ridwan Halim (ridwaanhall.com)",
                "license": "Apache License 2.0",
                "inspiration": {"Once UI": "Design system ideas."},
                "third_party_services": {"Cloudflare": "CDN and security."},
            },
        )

    def test_copyright_credits_rejects_unknown_keys(self):
        with self.assertRaises(ValidationError):
            CopyrightCreditsField(required=False).clean(json.dumps({"owner": "x", "nope": "y"}))

    # -- content blocks --------------------------------------------------

    def test_content_blocks_round_trip_every_stored_shape(self):
        self.assertRoundTrips(
            ContentBlockField(required=False),
            [
                {"text": "A <strong>paragraph</strong>.", "type": "p",
                 "class": "mb-4 text-sm md:text-base lg:text-lg"},
                # Two real class values contain double spaces.
                {"text": "Heading", "type": "h3", "class": "text-lg md:text-xl  mt-3 md:mt-4 mb-2"},
                {"type": "ul", "class": "list-disc pl-6",
                 "items": [
                     {"type": "li", "text": "Has no class key"},
                     {"type": "li", "text": "Has one", "class": "mb-2"},
                 ]},
                {"type": "table", "class": "mb-4",
                 "headers": ["Emoji", "Type"],
                 "rows": [["✨", "feat"], ["\U0001f41b", "fix"]]},
                {"type": "pre", "class": "bg-zinc-800",
                 "text": '<code class="language-python">todos = []\n\nwhile True:\n    pass</code>'},
            ],
        )

    def test_content_block_type_keeps_its_own_key_set(self):
        cleaned = _roundtrip(
            ContentBlockField(required=False),
            [{"type": "ul", "class": "x", "items": []}],
        )
        # A list block must never acquire a `text` key, and vice versa.
        self.assertEqual(sorted(cleaned[0]), ["class", "items", "type"])

    def test_content_block_list_item_class_absence_is_preserved(self):
        cleaned = _roundtrip(
            ContentBlockField(required=False),
            [{"type": "ul", "class": "x", "items": [{"type": "li", "text": "no class"}]}],
        )
        self.assertNotIn("class", cleaned[0]["items"][0])

    def test_content_block_rejects_ragged_table_rows(self):
        with self.assertRaises(ValidationError):
            ContentBlockField(required=False).clean(json.dumps(
                [{"type": "table", "class": "", "headers": ["a", "b"], "rows": [["only-one"]]}]
            ))

    # -- change detection ------------------------------------------------

    def test_has_changed_is_false_for_untouched_value(self):
        field = StringListField(required=False)
        value = ["a", "b"]
        self.assertFalse(field.has_changed(value, field.prepare_value(value)))

    def test_has_changed_is_false_for_a_blank_extra_formset_row(self):
        """A blank "add another" inline row must not count as changed.

        Regression test: an unsaved row has initial=None while to_python("")
        yields [], and reporting that as a change made Django fully validate
        the empty row and reject the whole page for missing required fields.
        """
        self.assertFalse(StringListField(required=False).has_changed(None, ""))
        self.assertFalse(KeyValueField(required=False).has_changed(None, ""))
        self.assertFalse(ContentBlockField(required=False).has_changed(None, ""))

    def test_has_changed_detects_reordering(self):
        # List order is meaningful (it drives render order), so a reorder must
        # register as a change or the save would be skipped in a formset.
        field = StringListField(required=False)
        self.assertTrue(field.has_changed(["a", "b"], json.dumps(["b", "a"])))


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
            period_start_month="Jan", period_start_year=2024,
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
            "period_start_month": self.experience.period_start_month,
            "period_start_year": self.experience.period_start_year,
            "period_end_month": "",
            "period_end_year": "",
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

