from django.test import TestCase
from unittest.mock import patch
from datetime import datetime, timezone

from apps.projects.types import Feature, ProjectData
from apps.core.data_service import DataService


class ProjectsTypesTest(TestCase):
    """Tests for OOP type classes in apps/projects/types/."""

    def test_feature_to_dict(self):
        feature = Feature(title="Search", description="Full-text search support")
        d = feature.to_dict()
        self.assertEqual(d["title"], "Search")
        self.assertEqual(d["description"], "Full-text search support")

    def test_project_data_to_dict(self):
        from datetime import datetime, timezone
        project = ProjectData(
            id=1, title="Test Project", headline="A test project",
            category="Web", is_featured=True, featured_priority=1,
            created_at=datetime(2025, 1, 1, tzinfo=timezone.utc),
        )
        d = project.to_dict()
        self.assertEqual(d["id"], 1)
        self.assertEqual(d["title"], "Test Project")
        self.assertTrue(d["is_featured"])
        self.assertEqual(d["featured_priority"], 1)

    def test_project_data_defaults(self):
        project = ProjectData(id=2, title="Project 2", headline="Tagline")
        self.assertEqual(project.category, "")
        self.assertEqual(project.status, "completed")
        self.assertFalse(project.is_featured)
        self.assertIsNone(project.github_url)


class ProjectsDataServiceTest(TestCase):
    """Tests that DataService correctly loads project data from apps/projects/data/."""

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
                "created_at": datetime(2026, 1, 2, tzinfo=timezone.utc),
            },
            {
                "title": "Planning Older",
                "status": "planning_requirements",
                "created_at": datetime(2026, 1, 1, tzinfo=timezone.utc),
            },
            {
                "title": "Planning Newer",
                "status": "planning_requirements",
                "created_at": datetime(2026, 1, 3, tzinfo=timezone.utc),
            },
            {
                "title": "Maintenance",
                "status": "maintenance_support",
                "created_at": datetime(2026, 1, 4, tzinfo=timezone.utc),
            },
            {
                "title": "On Hold",
                "status": "on_hold",
                "created_at": datetime(2026, 1, 5, tzinfo=timezone.utc),
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

