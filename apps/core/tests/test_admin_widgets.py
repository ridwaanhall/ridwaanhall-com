"""Fidelity of the structured JSON admin editors."""

import json

from django.core.exceptions import ValidationError
from django.test import TestCase

from apps.core.admin_widgets import (
    ContentBlockField,
    CopyrightCreditsField,
    GroupedKeyValueField,
    KeyValueField,
    StringListField,
)


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
