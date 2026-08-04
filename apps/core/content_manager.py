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

    @classmethod
    def get_featured_blogs(cls, limit=None):
        """Get featured blog posts."""
        blogs = cls.get_blogs()
        featured = [blog for blog in blogs if blog.get('is_featured', False)]

        if limit:
            featured = featured[:limit]

        return featured

    @classmethod
    def get_featured_projects(cls, limit=None):
        """Get featured projects."""
        projects = cls.get_projects()
        featured = [project for project in projects if project.get('is_featured', False)]

        if limit:
            featured = featured[:limit]

        return featured
