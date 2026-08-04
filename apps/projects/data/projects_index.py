"""
Projects data index - imports all individual project files
"""

from pathlib import Path

from apps.core.dynamic_loader import add_image_compat_fields, load_items_from_dir


def _finalize_project_data(project_data):
    """Add image compatibility fields and resolve any unresolved tech_stack keys."""
    add_image_compat_fields(project_data)

    if 'tech_stack' in project_data:
        # Extract the key references and resolve them
        tech_keys = []
        for tech in project_data['tech_stack']:
            # Check if tech is already a dict (backward compatibility)
            if isinstance(tech, dict) and 'name' in tech:
                # Already resolved object, keep as is
                continue
            else:
                # This should be a reference like SkillsData.tech_stack["python"]
                # We need to extract the actual object
                tech_keys.append(tech)

        # If we have key references, resolve them
        if tech_keys:
            project_data['tech_stack'] = tech_keys

    return project_data


class ProjectsDataIndex:
    """Dynamic loader for individual project files."""

    @classmethod
    def load_all_projects(cls):
        """Load all project data from individual files."""
        projects_dir = Path(__file__).parent / "projects"
        return load_items_from_dir(projects_dir, "project-*.py", "project_data", _finalize_project_data)

    @classmethod
    def get_projects(cls):
        """Get all project data."""
        return cls.load_all_projects()

# For backward compatibility
projects = ProjectsDataIndex.load_all_projects()
