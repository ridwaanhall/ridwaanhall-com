"""About-app model behaviour."""

from datetime import date

from django.test import TestCase


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
            title="Developer", company="Acme", period_start=date(2023, 1, 1),
            employment_type="Full-time", location_type="Remote", location="Jakarta",
            is_current=True, sort_order=0,
        )
        self.assertTrue(exp.is_current)
        # No end date is what makes a role "Present".
        self.assertIsNone(exp.period_end)

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
