from django.test import TestCase

from apps.about.types import (
    CV, PersonalInfo, Bio, AboutLocation, SocialMedia, DonateLink, AboutDataModel,
    IssuedDate, PeriodDate, Period, Experience, EducationDate, EducationLocation,
    Education, Certification, Award, Skill, JourneyStep, Application,
)
from apps.data.data_service import DataService


class AboutTypesTest(TestCase):
    """Tests for OOP type classes in apps/about/types/."""

    def test_cv_to_dict(self):
        cv = CV(main="https://example.com/cv", latest="https://example.com/cv-latest", copy="https://example.com/cv-copy")
        d = cv.to_dict()
        self.assertEqual(d["main"], "https://example.com/cv")
        self.assertEqual(d["latest"], "https://example.com/cv-latest")
        self.assertEqual(d["copy"], "https://example.com/cv-copy")

    def test_skill_to_dict(self):
        skill = Skill(name="Python", description="A programming language", icon_svg="<svg/>")
        d = skill.to_dict()
        self.assertEqual(d["name"], "Python")
        self.assertEqual(d["description"], "A programming language")
        self.assertEqual(d["icon_svg"], "<svg/>")

    def test_skill_default_icon_svg(self):
        skill = Skill(name="Test", description="Test skill")
        self.assertEqual(skill.icon_svg, "")

    def test_period_date_to_dict(self):
        pd = PeriodDate(month="Jan", year=2024)
        d = pd.to_dict()
        self.assertEqual(d["month"], "Jan")
        self.assertEqual(d["year"], 2024)

    def test_experience_to_dict(self):
        exp = Experience(
            id=1, title="Developer", company="Acme", logo="logo.png",
            period=Period(start=PeriodDate("Jan", 2023), end="Present"),
            employment_type="Full-time", location_type="Remote",
            location="Jakarta", is_current=True,
        )
        d = exp.to_dict()
        self.assertEqual(d["id"], 1)
        self.assertEqual(d["title"], "Developer")
        self.assertTrue(d["is_current"])

    def test_education_to_dict(self):
        edu = Education(
            degree="Bachelor", institution="UTY", logo="logo.png",
            is_last=True,
            location=EducationLocation(regency="Yogyakarta", province="DIY", prov="DIY", country="Indonesia", flag="🇮🇩"),
        )
        d = edu.to_dict()
        self.assertEqual(d["degree"], "Bachelor")
        self.assertTrue(d["is_last"])

    def test_application_to_dict(self):
        app = Application(
            id=1, status="Applied", company_name="Acme", position="Developer",
            employment_type="Full-time", location_type="Remote", location="Jakarta",
        )
        d = app.to_dict()
        self.assertEqual(d["id"], 1)
        self.assertEqual(d["status"], "Applied")

    def test_about_data_model_to_dict(self):
        model = AboutDataModel(
            personal=PersonalInfo(
                name="Test User", first_name="Test", last_name="User",
                username="testuser", aka="t", image_url="img.png",
                personal_website="https://example.com",
                cv=CV(main="c", latest="l", copy="cp"),
                role="Dev", is_active=True, is_open_to_work=False, is_hiring=False,
            ),
            bio=Bio(short_description="desc", short_bio="bio", short_cta="cta", long_description="long"),
        )
        d = model.to_dict()
        self.assertEqual(d["personal"]["name"], "Test User")
        self.assertEqual(d["bio"]["short_bio"], "bio")


class AboutDataServiceTest(TestCase):
    """Tests that DataService correctly loads about data from apps/about/data/."""

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

