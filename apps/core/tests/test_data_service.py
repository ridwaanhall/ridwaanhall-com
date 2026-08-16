"""DataService's privacy-policy accessor, now backed by a legal document."""

from django.test import TestCase

from apps.core.data_service import DataService


class CoreDataServiceTest(TestCase):
    """DataService.get_privacy_policy still returns a dict for its callers,
    even though the storage moved from a singleton to LegalDocument."""

    @classmethod
    def setUpTestData(cls):
        from apps.legal.models import LegalDocument, LegalSection

        # The migrations already seed this document, so update it rather than
        # creating a second one on a unique slug.
        document = LegalDocument.objects.get(slug="privacy-policy")
        document.summary = "This is an overview."
        document.save()
        document.sections.all().delete()
        LegalSection.objects.create(
            document=document, heading="Overview", body="This is an overview.", order=1,
        )

    def test_get_privacy_policy_returns_dict(self):
        result = DataService.get_privacy_policy()
        self.assertIsInstance(result, dict)

    def test_privacy_policy_has_a_title_and_sections(self):
        result = DataService.get_privacy_policy()
        self.assertEqual(result["title"], "Privacy Policy")
        self.assertEqual(result["sections"][0]["heading"], "Overview")

    def test_privacy_policy_has_last_updated(self):
        result = DataService.get_privacy_policy()
        self.assertIn("last_updated", result)

    def test_a_missing_document_gives_an_empty_dict_not_an_error(self):
        from apps.legal.models import LegalDocument

        LegalDocument.objects.all().delete()
        self.assertEqual(DataService.get_privacy_policy(), {})


def _roundtrip(field, value):
    """Push a stored value through render -> submit -> clean, as admin would."""
    return field.clean(field.prepare_value(value))
