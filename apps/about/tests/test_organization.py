"""The shared Organization record.

Experience, Education, Certification and Award used to each carry their own
name, logo and website. Across the real data that was 33 rows describing only
19 organisations, so one logo change meant editing up to six rows.
"""

from datetime import date

from django.db import IntegrityError
from django.test import TestCase

from apps.about.manager import AboutManager
from apps.about.models import (
    Award,
    Certification,
    Education,
    Experience,
    Organization,
)


def make_org(name="Acme", **kwargs):
    return Organization.objects.create(name=name, **kwargs)


def make_experience(org=None, **kwargs):
    defaults = {
        "title": "Dev", "organization": org or make_org(),
        "period_start": date(2024, 1, 1), "employment_type": "Full-time",
        "location_type": "Remote", "location": "Remote",
        "is_current": True, "sort_order": 0,
    }
    defaults.update(kwargs)
    return Experience.objects.create(**defaults)


class OrganizationModelTest(TestCase):
    def test_the_name_is_unique(self):
        make_org("Acme")
        with self.assertRaises(IntegrityError):
            make_org("Acme")

    def test_the_slug_is_derived_from_the_name(self):
        self.assertEqual(make_org("Coding Camp powered by DBS Foundation").slug,
                         "coding-camp-powered-by-dbs-foundation")

    def test_one_organisation_serves_many_rows_across_models(self):
        """The real case: "Coding Camp powered by DBS Foundation" appears in
        both Experience and Certification."""
        org = make_org("Coding Camp")
        make_experience(org=org)
        make_experience(org=org, title="Second")
        Certification.objects.create(title="Cert", organization=org, issued=date(2024, 6, 1))

        self.assertEqual(org.experiences.count(), 2)
        self.assertEqual(org.certifications.count(), 1)

    def test_distinct_organisations_may_share_a_logo_file(self):
        """"LinkedIn" and "LinkedIn Learning" are different issuers on one mark,
        which is why organisations are keyed on the name and not the logo."""
        first = make_org("LinkedIn")
        first.logo.name = "logo/linkedin.webp"
        first.save()
        second = make_org("LinkedIn Learning")
        second.logo.name = "logo/linkedin.webp"
        second.save()

        self.assertEqual(Organization.objects.filter(logo="logo/linkedin.webp").count(), 2)

    def test_an_organisation_in_use_cannot_be_deleted(self):
        """PROTECT, not CASCADE: deleting an organisation must not silently take
        every experience and certification that referenced it."""
        from django.db.models import ProtectedError

        org = make_org("Acme")
        make_experience(org=org)

        with self.assertRaises(ProtectedError):
            org.delete()


class RenderedShapeUnchangedTest(TestCase):
    """The manager still speaks company/institution/logo, so no template moved."""

    def test_experience_reports_its_organisation_as_company(self):
        org = make_org("Acme", website="https://acme.test")
        org.logo.name = "logo/acme.webp"
        org.save()
        make_experience(org=org)

        entry = AboutManager._build_experiences()[0]

        self.assertEqual(entry["company"], "Acme")
        self.assertEqual(entry["website"], "https://acme.test")
        self.assertIn("logo/acme.webp", entry["logo"])

    def test_education_certification_and_award_report_institution(self):
        org = make_org("Uni", website="https://uni.test")
        Education.objects.create(degree="BSc", organization=org)
        Certification.objects.create(title="C", organization=org, issued=date(2024, 1, 1))
        Award.objects.create(title="A", organization=org, issued=date(2024, 1, 1))

        self.assertEqual(AboutManager._build_education()[0]["institution"], "Uni")
        self.assertEqual(AboutManager._build_certifications()[0]["institution"], "Uni")
        self.assertEqual(AboutManager._build_awards()[0]["institution"], "Uni")

    def test_the_lists_do_not_issue_a_query_per_row(self):
        """Reading the name through a FK is an N+1 waiting to happen, so each
        builder select_related's the organisation."""
        org = make_org("Acme")
        for i in range(5):
            make_experience(org=org, title=f"Role {i}")

        with self.assertNumQueries(1):
            AboutManager._build_experiences()
