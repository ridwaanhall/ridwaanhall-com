"""
Enhanced sitemaps with better integration to SEO data.
Provides comprehensive sitemap generation for all content types.
"""

from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify
from math import ceil

from apps.data.data_service import DataService
from apps.seo.updated_at_data import UpdatedAtData
from apps.guestbook.models import ChatMessage


class StaticPagesSitemap(Sitemap):
    """
    Sitemap for static pages with pagination support.
    Includes main pages and paginated listing pages.
    """
    
    def __init__(self, items_per_page=6):
        self.items_per_page = items_per_page
        self.updated_at_map = {
            item['page']: item['updated_at']
            for item in UpdatedAtData.get_all_updated_data()
        }

    def items(self):
        """Generate list of static pages including paginated ones."""
        static_pages = ['home', 'dashboard', 'about', 'contact', 'privacy', 'guestbook']

        # Add blog pagination pages
        all_blogs = DataService.get_blogs()
        blog_pages = ceil(len(all_blogs) / self.items_per_page)
        blog_page_items = [f'blog-page-{i}' for i in range(1, blog_pages + 1)]

        # Add project pagination pages
        all_projects = DataService.get_projects()
        project_pages = ceil(len(all_projects) / self.items_per_page)
        project_page_items = [f'projects-page-{i}' for i in range(1, project_pages + 1)]

        return static_pages + blog_page_items + project_page_items

    def location(self, obj):
        """Generate URLs for static pages."""
        obj_str = str(obj)
        if obj_str.startswith('blog-page-'):
            page = int(obj_str.split('-')[-1])
            return reverse('blog') if page == 1 else f"{reverse('blog')}?page={page}"

        if obj_str.startswith('projects-page-'):
            page = int(obj_str.split('-')[-1])
            return reverse('projects') if page == 1 else f"{reverse('projects')}?page={page}"

        if obj_str == 'guestbook':
            return reverse('guestbook')

        return reverse(obj_str)

    def changefreq(self, obj):
        """Set change frequency based on page type."""
        if obj == 'dashboard':
            return 'daily'
        elif obj == 'home':
            return 'weekly'
        elif obj in ['about', 'contact', 'privacy', 'guestbook'] or obj.startswith('projects-page-'):
            return 'monthly'
        elif obj.startswith('blog-page-'):
            return 'monthly'
        return 'weekly'

    def priority(self, obj):
        """Set priority based on page importance."""
        if obj in ['home', 'dashboard', 'about', 'contact', 'privacy', 'guestbook']:
            return 1.0
        elif obj.startswith(('blog-page-', 'projects-page-')):
            page = int(obj.split('-')[-1])
            return 1.0 if page == 1 else 0.9
        return 0.9

    def lastmod(self, obj):
        """Get last modification date from updated_at data."""
        # Handle paginated blog pages - use blog data
        if obj.startswith('blog-page-'):
            base_item = 'blog'
        # Handle paginated project pages - use projects data  
        elif obj.startswith('projects-page-'):
            base_item = 'projects'
        # Handle guestbook - get latest message timestamp
        elif obj == 'guestbook':
            try:
                latest_message = ChatMessage.objects.first()  # Already ordered by -timestamp
                if latest_message:
                    return latest_message.timestamp
            except Exception:
                pass
            # Fallback to current time if no messages
            return timezone.now()
        else:
            base_item = obj
            
        if base_item in self.updated_at_map and self.updated_at_map[base_item]:
            try:
                return timezone.datetime.strptime(
                    self.updated_at_map[base_item], 
                    '%Y-%m-%d %H:%M:%S%z'
                )
            except ValueError:
                pass
        
        # Special case for dashboard - always current time
        if base_item == 'dashboard':
            return timezone.now()
        
        # Final fallback to a reasonable default date instead of today
        # This should rarely be hit now that we handle all cases properly
        return timezone.datetime(2024, 1, 1, tzinfo=timezone.get_current_timezone())


class BlogSitemap(Sitemap):
    """
    Sitemap for individual blog posts.
    Integrates with SEO data for better optimization.
    """
    changefreq = "monthly"
    
    def priority(self, obj):
        """Higher priority for featured blogs."""
        is_featured = obj.get('is_featured', False) if isinstance(obj, dict) else getattr(obj, 'is_featured', False)
        return 0.9 if is_featured else 0.7

    def items(self):
        """Get all blog posts."""
        return DataService.get_blogs()

    def location(self, obj):
        """Generate blog detail URLs."""
        title = obj.get('title') if isinstance(obj, dict) else getattr(obj, 'title', '')
        title = title or ''  # Ensure title is never None
        return reverse('blog_detail', kwargs={'title': slugify(title)})
    
    def lastmod(self, obj):
        """Get last modification date."""
        if isinstance(obj, dict):
            updated_at = obj.get('updated_at')
        else:
            updated_at = getattr(obj, 'updated_at', None)
            
        if updated_at:
            return updated_at
        return timezone.now()


class ProjectSitemap(Sitemap):
    """
    Sitemap for individual projects.
    Integrates with SEO data for better optimization.
    """
    changefreq = "monthly"
    
    def priority(self, obj):
        """Higher priority for featured projects."""
        is_featured = obj.get('is_featured', False) if isinstance(obj, dict) else getattr(obj, 'is_featured', False)
        return 0.9 if is_featured else 0.7

    def items(self):
        """Get all projects."""
        return DataService.get_projects()

    def location(self, obj):
        """Generate project detail URLs."""
        title = obj.get('title') if isinstance(obj, dict) else getattr(obj, 'title', '')
        title = title or ''  # Ensure title is never None
        return reverse('projects_detail', kwargs={'title': slugify(title)})
    
    def lastmod(self, obj):
        """Get last modification date."""
        if isinstance(obj, dict):
            updated_at = obj.get('updated_at')
        else:
            updated_at = getattr(obj, 'updated_at', None)
            
        if updated_at:
            return updated_at
        return timezone.now()
