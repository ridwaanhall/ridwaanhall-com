"""
Data Manager - Central controller for blog and project data
Supports both centralized and individual file systems.
"""

import os
from django.conf import settings

class DataManager:
    """
    Central data manager that can load data from either:
    1. Centralized files (blog_data.py, projects_data.py)
    2. Individual files (blog/*.py, projects/*.py)
    """
    
    USE_INDIVIDUAL_FILES = getattr(settings, 'USE_INDIVIDUAL_DATA_FILES', True)
    
    @classmethod
    def get_blogs(cls):
        """Get all blog data using the configured method."""
        if cls.USE_INDIVIDUAL_FILES:
            return cls._get_blogs_from_individual_files()
        else:
            return cls._get_blogs_from_centralized_file()
    
    @classmethod
    def get_projects(cls):
        """Get all project data using the configured method."""
        if cls.USE_INDIVIDUAL_FILES:
            return cls._get_projects_from_individual_files()
        else:
            return cls._get_projects_from_centralized_file()
    
    @classmethod
    def _get_blogs_from_centralized_file(cls):
        """Load blogs from the centralized blog_data.py file."""
        from .blog_data import BlogData
        return BlogData.blogs
    
    @classmethod
    def _get_projects_from_centralized_file(cls):
        """Load projects from the centralized projects_data.py file."""
        from .projects_data import ProjectsData
        return ProjectsData.projects
    
    @classmethod
    def _get_blogs_from_individual_files(cls):
        """Load blogs from individual files in the blog/ directory."""
        try:
            from .blog_index import BlogDataIndex
            return BlogDataIndex.load_all_blogs()
        except ImportError:
            # Fallback to centralized if individual files not available
            return cls._get_blogs_from_centralized_file()
    
    @classmethod
    def _get_projects_from_individual_files(cls):
        """Load projects from individual files in the projects/ directory."""
        try:
            from .projects_index import ProjectsDataIndex
            return ProjectsDataIndex.load_all_projects()
        except ImportError:
            # Fallback to centralized if individual files not available
            return cls._get_projects_from_centralized_file()
    
    @classmethod
    def get_blog_by_id(cls, blog_id):
        """Get a specific blog by ID."""
        blogs = cls.get_blogs()
        for blog in blogs:
            if blog.get('id') == blog_id:
                return blog
        return None
    
    @classmethod
    def get_project_by_id(cls, project_id):
        """Get a specific project by ID."""
        projects = cls.get_projects()
        for project in projects:
            if project.get('id') == project_id:
                return project
        return None
    
    @classmethod
    def get_featured_blogs(cls, limit=None):
        """Get featured blog posts."""
        blogs = cls.get_blogs()
        featured = [blog for blog in blogs if blog.get('is_featured', False)]
        if limit:
            return featured[:limit]
        return featured
    
    @classmethod
    def get_featured_projects(cls, limit=None):
        """Get featured projects."""
        projects = cls.get_projects()
        featured = [project for project in projects if project.get('is_featured', False)]
        if limit:
            return featured[:limit]
        return featured
    
    @classmethod
    def get_recent_blogs(cls, limit=5):
        """Get recent blog posts."""
        blogs = cls.get_blogs()
        # Sort by created_at if available, otherwise by ID
        sorted_blogs = sorted(
            blogs, 
            key=lambda x: x.get('created_at') or x.get('id', 0), 
            reverse=True
        )
        return sorted_blogs[:limit]
    
    @classmethod
    def get_recent_projects(cls, limit=5):
        """Get recent projects."""
        projects = cls.get_projects()
        # Sort by updated_at if available, otherwise by ID
        sorted_projects = sorted(
            projects, 
            key=lambda x: x.get('updated_at') or x.get('id', 0), 
            reverse=True
        )
        return sorted_projects[:limit]
    
    @classmethod
    def switch_to_individual_files(cls):
        """Switch to using individual files."""
        cls.USE_INDIVIDUAL_FILES = True
        print("✅ Switched to individual file system")
    
    @classmethod
    def switch_to_centralized_files(cls):
        """Switch to using centralized files."""
        cls.USE_INDIVIDUAL_FILES = False
        print("✅ Switched to centralized file system")
    
    @classmethod
    def get_data_source_info(cls):
        """Get information about the current data source."""
        if cls.USE_INDIVIDUAL_FILES:
            blogs_count = len(cls.get_blogs())
            projects_count = len(cls.get_projects())
            return {
                'source': 'individual_files',
                'description': 'Using individual files from blog/ and projects/ directories',
                'blogs_count': blogs_count,
                'projects_count': projects_count,
                'blog_files': f'apps/data/blog/ ({blogs_count} files)',
                'project_files': f'apps/data/projects/ ({projects_count} files)'
            }
        else:
            blogs_count = len(cls.get_blogs())
            projects_count = len(cls.get_projects())
            return {
                'source': 'centralized_files',
                'description': 'Using centralized blog_data.py and projects_data.py',
                'blogs_count': blogs_count,
                'projects_count': projects_count,
                'blog_files': 'apps/data/blog_data.py',
                'project_files': 'apps/data/projects_data.py'
            }

# Backward compatibility - expose the same interface as the original files
class BlogData:
    """Backward compatible blog data interface."""
    
    @property
    def blogs(self):
        return DataManager.get_blogs()

class ProjectsData:
    """Backward compatible projects data interface."""
    
    @property
    def projects(self):
        return DataManager.get_projects()

# Create instances for backward compatibility
BlogDataCompat = BlogData()
ProjectsDataCompat = ProjectsData()
