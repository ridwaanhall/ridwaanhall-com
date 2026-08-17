from django.test import TestCase

from apps.about.manager import AboutManager
from apps.about.models import Profile, ProfileSkillHighlight, Skill
from apps.seo.schema import SEOSchemaGenerator


class PersonSchemaTest(TestCase):
    """Guards the JSON-LD Person schema's dependency on about data.

    `knowsAbout` is the only consumer of Profile.skills_highlight anywhere in
    the project -- it appears in no template -- so without this the field could
    be refactored and nothing would notice.
    """

    @classmethod
    def setUpTestData(cls):
        cls.profile = Profile.objects.create(
            name="Ridwan Halim", role="Full Stack Developer",
            short_description="Builds things.",
        )
        skills = [
            Skill.objects.create(slug="python", name="Python"),
            Skill.objects.create(slug="django", name="Django"),
            Skill.objects.create(slug="flask", name="Flask"),
        ]
        for position, skill in enumerate(skills):
            ProfileSkillHighlight.objects.create(
                profile=cls.profile, skill=skill, order=position
            )

    def test_knows_about_is_a_list_of_skill_names_in_editorial_order(self):
        schema = SEOSchemaGenerator.generate_person_schema(AboutManager.get_about_data())
        self.assertEqual(schema["knowsAbout"], ["Python", "Django", "Flask"])

    def test_knows_about_follows_the_order_column(self):
        """Reordering in admin must change the emitted JSON-LD array."""
        for slug, position in (("flask", 0), ("python", 1), ("django", 2)):
            ProfileSkillHighlight.objects.filter(skill__slug=slug).update(order=position)
        schema = SEOSchemaGenerator.generate_person_schema(AboutManager.get_about_data())
        self.assertEqual(schema["knowsAbout"], ["Flask", "Python", "Django"])

    def test_knows_about_is_empty_when_no_skills_selected(self):
        self.profile.skill_highlights.all().delete()
        schema = SEOSchemaGenerator.generate_person_schema(AboutManager.get_about_data())
        self.assertEqual(schema["knowsAbout"], [])

    def test_person_schema_keeps_core_identity_fields(self):
        schema = SEOSchemaGenerator.generate_person_schema(AboutManager.get_about_data())
        self.assertEqual(schema["name"], "Ridwan Halim")
        self.assertIn("jobTitle", schema)
        self.assertIn("alumniOf", schema)
