"""DataService's about-data accessors."""

from datetime import date

from django.test import TestCase

from apps.core.data_service import DataService


class AboutDataServiceTest(TestCase):
    """Tests that DataService correctly loads about data (ORM-backed)."""

    @classmethod
    def setUpTestData(cls):
        from apps.about.models import Education, Experience, Profile

        Profile.objects.create(name="Test Author", role="Developer")
        Experience.objects.create(
            title="Current Role", company="Acme", period_start=date(2024, 1, 1),
            is_current=True, sort_order=0,
        )
        Experience.objects.create(
            title="Past Role", company="Old Co", period_start=date(2020, 1, 1),
            period_end=date(2023, 12, 1), is_current=False, sort_order=1,
        )
        Education.objects.create(degree="Bachelor's", institution="UTY", is_last=True)
        Education.objects.create(degree="High School", institution="Al Mukmin", is_last=False)

    def test_get_about_data_returns_dict(self):
        result = DataService.get_about_data()
        self.assertIsNotNone(result)
        self.assertIsInstance(result, dict)

    def test_about_data_has_required_fields(self):
        result = DataService.get_about_data()
        self.assertIn("name", result)
        self.assertIn("role", result)

    def test_get_experiences_returns_list(self):
        result = DataService.get_experiences()
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)

    def test_get_experiences_current_only(self):
        all_exp = DataService.get_experiences()
        current = DataService.get_experiences(current_only=True)
        self.assertLessEqual(len(current), len(all_exp))
        for exp in current:
            self.assertTrue(exp.get("is_current"))

    def test_get_education_returns_list(self):
        result = DataService.get_education()
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)

    def test_get_education_last_only(self):
        last = DataService.get_education(last_only=True)
        for edu in last:
            self.assertTrue(edu.get("is_last"))

    def test_get_certifications_returns_list(self):
        result = DataService.get_certifications()
        self.assertIsInstance(result, list)

    def test_get_skills_returns_list_with_icon_svg(self):
        result = DataService.get_skills()
        self.assertIsInstance(result, list)
        for skill in result:
            self.assertTrue(skill.get("icon_svg", "").strip())

    def test_get_awards_sorted_by_id_desc(self):
        result = DataService.get_awards(sort_by_id=True)
        self.assertIsInstance(result, list)
        ids = [a.get("id", 0) for a in result]
        self.assertEqual(ids, sorted(ids, reverse=True))

    def test_get_applications_returns_list(self):
        result = DataService.get_applications()
        self.assertIsInstance(result, list)
