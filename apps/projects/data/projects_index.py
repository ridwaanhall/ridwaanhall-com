"""
Projects data index - imports all individual project files
"""

from pathlib import Path

from apps.core.dynamic_loader import add_image_compat_fields, load_items_from_dir


class ProjectsDataIndex:
    """Dynamic loader for individual project files."""

    @classmethod
    def load_all_projects(cls):
        """Load all project data from individual files."""
        projects_dir = Path(__file__).parent / "projects"
        return load_items_from_dir(projects_dir, "project-*.py", "project_data", add_image_compat_fields)

    @classmethod
    def get_projects(cls):
        """Get all project data."""
        return cls.load_all_projects()

# For backward compatibility
projects = ProjectsDataIndex.load_all_projects()
