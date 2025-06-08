"""
SEO Mixins
Reusable mixins for views to automatically include SEO functionality.
"""

from typing import Dict, Any
from django.views.generic import TemplateView
from apps.data.about_data import AboutData
from .manager import SEOManager


class SEOMixin:
    """
    Mixin to add SEO functionality to any view.
    Automatically generates SEO data based on the view type.
    """
    
    seo_type = None  # Override in subclasses: 'homepage', 'blog_list', etc.
    
    def get_about_data(self):
        """Get about data with fallback."""
        about_data = AboutData.get_about_data()
        if not about_data:
            raise FileNotFoundError("About data is missing.")
        return about_data[0]
    
    def get_seo_manager(self):
        """Get SEO manager instance."""
        about = self.get_about_data()
        return SEOManager(about)
    
    def get_seo_data(self, **kwargs):
        """
        Generate SEO data based on seo_type.
        Override this method for custom SEO data.
        """
        seo_manager = self.get_seo_manager()
        
        if self.seo_type == 'homepage':
            return seo_manager.get_homepage_seo()
        elif self.seo_type == 'about':
            return seo_manager.get_about_seo()
        elif self.seo_type == 'contact':
            return seo_manager.get_contact_seo()
        elif self.seo_type == 'dashboard':
            return seo_manager.get_dashboard_seo()
        elif self.seo_type == 'blog_list':
            blogs = kwargs.get('blogs', [])
            page = kwargs.get('page', 1)
            return seo_manager.get_blog_list_seo(blogs, page)
        elif self.seo_type == 'blog_detail':
            blog_data = kwargs.get('blog_data', {})
            return seo_manager.get_blog_detail_seo(blog_data)
        elif self.seo_type == 'projects_list':
            projects = kwargs.get('projects', [])
            page = kwargs.get('page', 1)
            return seo_manager.get_projects_list_seo(projects, page)
        elif self.seo_type == 'project_detail':
            project_data = kwargs.get('project_data', {})
            return seo_manager.get_project_detail_seo(project_data)
        elif self.seo_type == 'privacy_policy':
            return seo_manager.get_privacy_policy_seo()
        else:
            # Default SEO data
            return {
                'title': 'ridwaanhall.com',
                'description': 'Ridwan Hall - Software Developer & AI Engineer',
                'keywords': 'ridwan hall, software developer, ai engineer',
                'og_image': self.get_about_data().get('image_url', ''),
                'og_type': 'website',
                'twitter_card': 'summary_large_image',
                'schemas': []
            }
    
    def get_context_data(self, **kwargs):
        """Add SEO data to context."""
        context = super().get_context_data(**kwargs) if hasattr(super(), 'get_context_data') else kwargs
        
        # Generate SEO data
        seo_kwargs = {
            'blogs': context.get('blogs', []),
            'projects': context.get('projects', []),
            'blog_data': context.get('blog', {}),
            'project_data': context.get('project', {}),
            'page': self.request.GET.get('page', 1) if hasattr(self, 'request') else 1
        }
        
        seo_data = self.get_seo_data(**seo_kwargs)
        seo_manager = self.get_seo_manager()
        
        # Add formatted meta tags
        context['seo'] = seo_manager.get_meta_tags(seo_data, getattr(self, 'request', None))
        context['about'] = self.get_about_data()
        
        return context


class HomepageSEOMixin(SEOMixin):
    """SEO mixin specifically for homepage."""
    seo_type = 'homepage'


class AboutSEOMixin(SEOMixin):
    """SEO mixin specifically for about page."""
    seo_type = 'about'


class ContactSEOMixin(SEOMixin):
    """SEO mixin specifically for contact page."""
    seo_type = 'contact'


class DashboardSEOMixin(SEOMixin):
    """SEO mixin specifically for dashboard page."""
    seo_type = 'dashboard'


class BlogListSEOMixin(SEOMixin):
    """SEO mixin specifically for blog listing page."""
    seo_type = 'blog_list'


class BlogDetailSEOMixin(SEOMixin):
    """SEO mixin specifically for blog detail page."""
    seo_type = 'blog_detail'


class ProjectsListSEOMixin(SEOMixin):
    """SEO mixin specifically for projects listing page."""
    seo_type = 'projects_list'


class ProjectDetailSEOMixin(SEOMixin):
    """SEO mixin specifically for project detail page."""
    seo_type = 'project_detail'


class PrivacyPolicySEOMixin(SEOMixin):
    """SEO mixin specifically for privacy policy page."""
    seo_type = 'privacy_policy'
