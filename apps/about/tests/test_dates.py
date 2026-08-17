"""Dates are stored as dates, and still render as they always did.

The storage changed from a CharField month beside an IntegerField year to a
single DateField. The manager still hands templates the {"month", "year"} pair,
so the visible output is unchanged -- these tests hold both halves of that in
place, since either could drift without the other noticing.
"""

from datetime import date

from django.test import TestCase

from apps.about.manager import AboutManager
from apps.about.models import Award, Certification, Education, Experience, Organization


def make_org(name="Acme"):
    """Organisations are shared now, so tests reuse one rather than inventing
    a company name per row."""
    org, _ = Organization.objects.get_or_create(name=name, defaults={"website": "https://acme.test"})
    return org


def make_experience(**kwargs):
    company = kwargs.pop("company", "Acme")
    defaults = {
        "title": "Dev", "organization": make_org(company), "period_start": date(2024, 3, 1),
        "employment_type": "Full-time", "location_type": "Remote",
        "location": "Remote", "is_current": False, "sort_order": 0,
    }
    defaults.update(kwargs)
    return Experience.objects.create(**defaults)


class StoredAsDatesTest(TestCase):
    def test_experience_dates_are_real_dates(self):
        experience = make_experience()
        self.assertIsInstance(experience.period_start, date)

    def test_experience_can_be_ordered_by_date(self):
        """The month-name-plus-year pair could not be sorted in the database at
        all; this is the whole point of the change."""
        make_experience(company="Older", period_start=date(2019, 11, 1))
        make_experience(company="Newer", period_start=date(2024, 3, 1))
        make_experience(company="Middle", period_start=date(2021, 6, 1))

        ordered = Experience.objects.order_by("period_start").values_list("organization__name", flat=True)

        self.assertEqual(list(ordered), ["Older", "Middle", "Newer"])

    def test_experience_can_be_filtered_by_date(self):
        make_experience(company="Old", period_start=date(2019, 1, 1))
        make_experience(company="Recent", period_start=date(2024, 1, 1))

        recent = Experience.objects.filter(period_start__gte=date(2023, 1, 1))

        self.assertEqual([e.organization.name for e in recent], ["Recent"])


class RenderedShapeUnchangedTest(TestCase):
    """The about dict still speaks month/year, so no template had to change."""

    def test_experience_period_keeps_its_month_year_shape(self):
        make_experience(period_start=date(2024, 3, 1), period_end=date(2025, 7, 1))

        period = AboutManager._build_experiences()[0]["period"]

        self.assertEqual(period["start"], {"month": "Mar", "year": 2024})
        self.assertEqual(period["end"], {"month": "Jul", "year": 2025})

    def test_a_role_with_no_end_date_is_present(self):
        make_experience(period_end=None, is_current=True)

        self.assertEqual(AboutManager._build_experiences()[0]["period"]["end"], "Present")

    def test_certification_and_award_keep_their_issued_shape(self):
        Certification.objects.create(
            title="C", organization=make_org("I"), issued=date(2023, 12, 1),
        )
        Award.objects.create(title="A", organization=make_org("I"), issued=date(2022, 8, 1))

        self.assertEqual(
            AboutManager._build_certifications()[0]["issued"], {"month": "Dec", "year": 2023}
        )
        self.assertEqual(
            AboutManager._build_awards()[0]["issued"], {"month": "Aug", "year": 2022}
        )

    def test_education_without_dates_still_uses_its_year_range(self):
        """Older entries never recorded a month, so they keep the free-text
        range rather than being given an invented January."""
        Education.objects.create(degree="BSc", organization=make_org("Uni"), years="2018 - 2021")

        entry = AboutManager._build_education()[0]

        self.assertIsNone(entry["date"])
        self.assertEqual(entry["years"], "2018 - 2021")

    def test_education_with_dates_reports_them(self):
        Education.objects.create(
            degree="MSc", organization=make_org("Uni"),
            date_start=date(2021, 9, 1), date_end=date(2023, 6, 1),
        )

        entry = AboutManager._build_education()[0]

        self.assertEqual(entry["date"]["start"], {"month": "Sep", "year": 2021})
        self.assertEqual(entry["date"]["end"], {"month": "Jun", "year": 2023})


class SchemaOrgDatesTest(TestCase):
    """JSON-LD startDate/endDate are Date properties and need ISO 8601.

    This used to emit "Jan 2024", which is not a valid date and was silently
    ignored by consumers.
    """

    def test_the_manager_supplies_an_iso_form(self):
        make_experience(period_start=date(2024, 3, 1), period_end=date(2025, 7, 1))

        period = AboutManager._build_experiences()[0]["period"]

        self.assertEqual(period["start_iso"], "2024-03")
        self.assertEqual(period["end_iso"], "2025-07")

    def test_the_person_schema_emits_iso_dates(self):

        from apps.seo.schema import SEOSchemaGenerator

        make_experience(period_start=date(2024, 3, 1), period_end=date(2025, 7, 1))
        # The generator reads experiences from the manager itself.
        schema = SEOSchemaGenerator.generate_person_schema({"name": "Me", "skills": []})

        occupations = schema.get("workExperience") or []
        dated = [o for o in occupations if "startDate" in o]
        self.assertTrue(dated, "expected at least one dated occupation")
        for occupation in dated:
            self.assertRegex(occupation["startDate"], r"^\d{4}-\d{2}$")
            if "endDate" in occupation:
                self.assertRegex(occupation["endDate"], r"^\d{4}-\d{2}$")

    def test_a_current_role_has_no_end_date_at_all(self):
        from apps.seo.schema import SEOSchemaGenerator

        make_experience(period_end=None, is_current=True)
        # The generator reads experiences from the manager itself.
        schema = SEOSchemaGenerator.generate_person_schema({"name": "Me", "skills": []})

        for occupation in schema.get("workExperience") or []:
            self.assertNotIn("endDate", occupation)
