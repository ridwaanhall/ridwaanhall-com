"""Project, Feature and ProjectImage model behaviour."""


from django.test import TestCase

from apps.projects.types import ProjectStatus


class ProjectsModelsTest(TestCase):
    """Tests for the ORM models in apps/projects/models.py."""

    def test_feature_ordering(self):
        from apps.projects.models import Feature, Project

        project = Project.objects.create(title="Project 1", slug="project-1", headline="Tagline")
        Feature.objects.create(project=project, title="Search", description="Full-text search support", order=1)
        Feature.objects.create(project=project, title="Auth", description="Login support", order=0)
        self.assertEqual([f.title for f in project.features.all()], ["Auth", "Search"])

    def test_project_defaults(self):
        from apps.projects.models import Project

        project = Project.objects.create(title="Project 2", slug="project-2", headline="Tagline")
        self.assertEqual(project.category, "")
        self.assertEqual(project.status, ProjectStatus.COMPLETED.value)
        self.assertFalse(project.is_featured)
        self.assertIsNone(project.github_url)
