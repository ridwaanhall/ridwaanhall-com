from datetime import UTC, datetime
from unittest.mock import patch

from django.test import TestCase

from apps.core.data_service import DataService
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


class ProjectsDataServiceTest(TestCase):
    """Tests that DataService correctly loads project data (ORM-backed)."""

    @classmethod
    def setUpTestData(cls):
        from apps.projects.models import Project, ProjectImage

        featured = Project.objects.create(
            title="Featured Project", slug="featured-project", headline="A featured one",
            is_featured=True, featured_priority=1,
        )
        ProjectImage.objects.create(project=featured, image="project/fake.webp", original_filename="fake.webp")
        Project.objects.create(
            title="Regular Project", slug="regular-project", headline="Not featured", is_featured=False,
        )

    def test_get_projects_returns_list(self):
        result = DataService.get_projects()
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)

    def test_get_projects_featured_first(self):
        projects = DataService.get_projects(sort_by_featured=True)
        self.assertIsInstance(projects, list)
        featured = [p for p in projects if p.get("is_featured")]
        non_featured = [p for p in projects if not p.get("is_featured")]
        featured_indices = [projects.index(p) for p in featured]
        non_featured_indices = [projects.index(p) for p in non_featured]
        if featured_indices and non_featured_indices:
            self.assertLess(max(featured_indices), min(non_featured_indices))

    def test_project_has_required_fields(self):
        projects = DataService.get_projects()
        first = projects[0]
        self.assertIn("id", first)
        self.assertIn("title", first)
        self.assertIn("headline", first)

    def test_project_has_image_url_field(self):
        projects = DataService.get_projects()
        first = projects[0]
        self.assertIn("image_url", first)

    @patch("apps.core.data_service.ContentManager.get_projects")
    def test_get_projects_status_then_date_sort(self, mock_get_projects):
        mock_get_projects.return_value = [
            {
                "title": "Completed Newer",
                "status": "completed",
                "created_at": datetime(2026, 1, 2, tzinfo=UTC),
            },
            {
                "title": "Planning Older",
                "status": "planning_requirements",
                "created_at": datetime(2026, 1, 1, tzinfo=UTC),
            },
            {
                "title": "Planning Newer",
                "status": "planning_requirements",
                "created_at": datetime(2026, 1, 3, tzinfo=UTC),
            },
            {
                "title": "Maintenance",
                "status": "maintenance_support",
                "created_at": datetime(2026, 1, 4, tzinfo=UTC),
            },
            {
                "title": "On Hold",
                "status": "on_hold",
                "created_at": datetime(2026, 1, 5, tzinfo=UTC),
            },
        ]

        projects = DataService.get_projects(sort_by_featured=False, sort_by_status=True)
        titles = [p["title"] for p in projects]

        self.assertEqual(
            titles,
            [
                "Planning Newer",
                "Planning Older",
                "Maintenance",
                "On Hold",
                "Completed Newer",
            ],
        )

