"""
Content Manager - Central controller for blog and project data
Loads data from individual files only (no centralized files).
"""


class ContentManager:
    """
    Central data manager that loads data from individual files.
    """

    @classmethod
    def get_blogs(cls):
        """Get all blog data from individual files."""
        from apps.blog.data.blog_index import BlogDataIndex
        return BlogDataIndex.load_all_blogs()

    @classmethod
    def get_projects(cls):
        """Get all project data from individual files."""
        from apps.projects.data.projects_index import ProjectsDataIndex
        return ProjectsDataIndex.load_all_projects()
