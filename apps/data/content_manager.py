"""
Data Manager - Central controller for blog and project data
Loads data from individual files only (no centralized files).
"""

class ContentManager:
    """
    Central data manager that loads data from individual files.
    """
    
    @classmethod
    def get_blogs(cls):
        """Get all blog data from individual files."""
        from .content.blog_index import BlogDataIndex
        return BlogDataIndex.load_all_blogs()
    
    @classmethod
    def get_projects(cls):
        """Get all project data from individual files."""
        from .content.projects_index import ProjectsDataIndex
        return ProjectsDataIndex.load_all_projects()
    
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
    def get_data_source_info(cls):
        """Get information about the current data source."""
        blogs_count = len(cls.get_blogs())
        projects_count = len(cls.get_projects())
        return {
            'source': 'individual_files',
            'description': 'Using individual files from blog/ and projects/ directories',
            'blogs_count': blogs_count,
            'projects_count': projects_count,
            'blog_files': f'apps/data/content/blog/ ({blogs_count} files)',
            'project_files': f'apps/data/content/projects/ ({projects_count} files)'
        }