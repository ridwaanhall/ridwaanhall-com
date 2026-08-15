from django.test import TestCase

from apps.core.data_service import DataService


class AboutModelsTest(TestCase):
    """Tests for the ORM models in apps/about/models.py."""

    def test_profile_defaults(self):
        from apps.about.models import Profile

        profile = Profile.objects.create(name="Test User", role="Dev")
        self.assertFalse(profile.is_open_to_work)
        self.assertEqual(profile.stories, [])
        self.assertEqual(list(profile.skills_highlight.all()), [])

    def test_profile_skills_highlight_surfaces_as_names(self):
        """AboutManager must keep emitting a list[str] for JSON-LD knowsAbout."""
        from apps.about.manager import AboutManager
        from apps.about.models import Profile, ProfileSkillHighlight, Skill

        profile = Profile.objects.create(name="Test User", role="Dev")
        python = Skill.objects.create(slug="python", name="Python")
        django_skill = Skill.objects.create(slug="django", name="Django")
        ProfileSkillHighlight.objects.create(profile=profile, skill=python, order=0)
        ProfileSkillHighlight.objects.create(profile=profile, skill=django_skill, order=1)

        self.assertEqual(AboutManager.get_about_data()["skills"], ["Python", "Django"])

    def test_profile_skills_highlight_follows_editorial_order_not_pk(self):
        """The whole point of the through model: order is curated, not by id.

        Skills are created in one order and highlighted in the reverse of it,
        so a result matching pk order would mean the ordering is being ignored.
        """
        from apps.about.manager import AboutManager
        from apps.about.models import Profile, ProfileSkillHighlight, Skill

        profile = Profile.objects.create(name="Test User", role="Dev")
        first = Skill.objects.create(slug="alpha", name="Alpha")
        second = Skill.objects.create(slug="beta", name="Beta")
        third = Skill.objects.create(slug="gamma", name="Gamma")
        ProfileSkillHighlight.objects.create(profile=profile, skill=third, order=0)
        ProfileSkillHighlight.objects.create(profile=profile, skill=first, order=1)
        ProfileSkillHighlight.objects.create(profile=profile, skill=second, order=2)

        self.assertEqual(
            AboutManager.get_about_data()["skills"], ["Gamma", "Alpha", "Beta"]
        )

    def test_profile_skill_highlight_cannot_be_duplicated(self):
        from django.db import IntegrityError

        from apps.about.models import Profile, ProfileSkillHighlight, Skill

        profile = Profile.objects.create(name="Test User", role="Dev")
        skill = Skill.objects.create(slug="python", name="Python")
        ProfileSkillHighlight.objects.create(profile=profile, skill=skill, order=0)
        with self.assertRaises(IntegrityError):
            ProfileSkillHighlight.objects.create(profile=profile, skill=skill, order=1)

    def test_skill_default_icon_svg(self):
        from apps.about.models import Skill

        skill = Skill.objects.create(slug="test", name="Test", description="Test skill")
        self.assertEqual(skill.icon_svg, "")

    def test_experience_current_and_sort_order(self):
        from apps.about.models import Experience

        exp = Experience.objects.create(
            title="Developer", company="Acme", period_start_month="Jan", period_start_year=2023,
            employment_type="Full-time", location_type="Remote", location="Jakarta",
            is_current=True, sort_order=0,
        )
        self.assertTrue(exp.is_current)
        self.assertIsNone(exp.period_end_month)

    def test_education_is_last(self):
        from apps.about.models import Education

        edu = Education.objects.create(degree="Bachelor", institution="UTY", is_last=True)
        self.assertTrue(edu.is_last)

    def test_application_defaults(self):
        from apps.about.models import Application

        app = Application.objects.create(
            status="Applied", company_name="Acme", position="Developer",
            employment_type="Full-time", location_type="Remote", location="Jakarta",
        )
        self.assertEqual(app.status, "Applied")
        self.assertEqual(app.lessons_learned, "")


class AboutDataServiceTest(TestCase):
    """Tests that DataService correctly loads about data (ORM-backed)."""

    @classmethod
    def setUpTestData(cls):
        from apps.about.models import Education, Experience, Profile

        Profile.objects.create(name="Test Author", role="Developer")
        Experience.objects.create(
            title="Current Role", company="Acme", period_start_month="Jan", period_start_year=2024,
            is_current=True, sort_order=0,
        )
        Experience.objects.create(
            title="Past Role", company="Old Co", period_start_month="Jan", period_start_year=2020,
            period_end_month="Dec", period_end_year=2023, is_current=False, sort_order=1,
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

