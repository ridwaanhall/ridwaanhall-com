"""The shared Organization record.

Experience, Education, Certification and Award used to each carry their own
name, logo and website. Across the real data that was 33 rows describing only
19 organisations, so one logo change meant editing up to six rows.
"""

from datetime import date

from django.db import IntegrityError
from django.test import TestCase, override_settings

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


@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=["testserver"])
class OrganizationAdminTest(TestCase):
    """The changelist shows how many rows use each organisation.

    Counting per relation inside list_display issued four queries for every
    row -- 76 sequential round trips to Supabase for 19 organisations, which
    timed the page out with a 504 in production. The counts are annotated onto
    the changelist query instead.
    """

    def setUp(self):
        from django.contrib.auth.models import User

        self.user = User.objects.create_superuser("root", "root@example.com", "pw")
        self.client.force_login(self.user)

    def seed(self, start, count):
        for i in range(start, start + count):
            org = make_org(f"Org {i}")
            make_experience(org=org, title=f"Role {i}")
            Certification.objects.create(
                title=f"Cert {i}", organization=org, issued=date(2024, 1, 1),
            )

    def changelist_queries(self):
        from django.db import connection
        from django.test.utils import CaptureQueriesContext

        with CaptureQueriesContext(connection) as captured:
            response = self.client.get("/admin/about/organization/")
        self.assertEqual(response.status_code, 200)
        return len(captured.captured_queries)

    def test_the_changelist_cost_does_not_grow_with_the_row_count(self):
        """The exact number is not the point -- that it stays flat is. Counting
        per relation made it 4 queries per row, which is what took the page
        past the gateway timeout once there were enough organisations.
        """
        self.seed(0, 5)
        with_five = self.changelist_queries()

        self.seed(5, 20)
        with_twenty_five = self.changelist_queries()

        self.assertEqual(
            with_five, with_twenty_five,
            f"cost grew with row count: {with_five} -> {with_twenty_five}",
        )

    def test_the_counts_are_correct_and_not_multiplied_by_the_joins(self):
        """Four counts over four joins multiply without distinct=True: an
        organisation with 3 experiences and 1 certification would report 3
        certifications."""
        org = make_org("Acme")
        for i in range(3):
            make_experience(org=org, title=f"Role {i}")
        Certification.objects.create(title="C", organization=org, issued=date(2024, 1, 1))

        html = self.client.get("/admin/about/organization/").content.decode()

        self.assertIn("3 experience", html)
        self.assertIn("1 certification", html)

    def test_an_unused_organisation_says_so(self):
        make_org("Nobody")
        self.assertIn("unused", self.client.get("/admin/about/organization/").content.decode())
