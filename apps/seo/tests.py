from django.test import TestCase

from apps.about.manager import AboutManager
from apps.about.models import Profile, Skill
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
        cls.profile.skills_highlight.set(skills)

    def test_knows_about_is_a_list_of_skill_names(self):
        schema = SEOSchemaGenerator.generate_person_schema(AboutManager.get_about_data())
        self.assertEqual(schema["knowsAbout"], ["Python", "Django", "Flask"])

    def test_knows_about_is_empty_when_no_skills_selected(self):
        self.profile.skills_highlight.clear()
        schema = SEOSchemaGenerator.generate_person_schema(AboutManager.get_about_data())
        self.assertEqual(schema["knowsAbout"], [])

    def test_person_schema_keeps_core_identity_fields(self):
        schema = SEOSchemaGenerator.generate_person_schema(AboutManager.get_about_data())
        self.assertEqual(schema["name"], "Ridwan Halim")
        self.assertIn("jobTitle", schema)
        self.assertIn("alumniOf", schema)
