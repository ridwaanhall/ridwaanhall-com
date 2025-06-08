"""
Blog views for listing and displaying blog posts.
Handles blog listing with pagination and individual blog post details.
"""

from django.utils.text import slugify
from django.http import Http404
from django.core.exceptions import SuspiciousOperation

from apps.core.base_views import PaginatedView, DetailView
from apps.core.data_service import DataService
from apps.seo.mixins import BlogListSEOMixin, BlogDetailSEOMixin


class BlogView(BlogListSEOMixin, PaginatedView):
    """
    Blog listing view with pagination and featured blogs.
    Displays all blog posts with SEO metadata.
    """
    template_name = 'blog/blog.html'
    items_per_page = 6

    def get(self, request, *args, **kwargs):
        return self.handle_exceptions(self._get)(request, *args, **kwargs)
    
    def _get(self, request, *args, **kwargs):
        # Get all blogs sorted by ID descending
        all_blogs = DataService.get_blogs()
        
        # Paginate blogs
        pagination_data = self.paginate_items(request, all_blogs, self.items_per_page)
        
        # Get featured blogs
        featured_blogs = DataService.get_blogs(featured_only=True)[:3]
        
        context = self.get_common_context()
        context.update({
            'blogs': pagination_data['page_obj'],
            'featured_blogs': featured_blogs,
            'paginator': pagination_data['paginator'],
            'is_paginated': pagination_data['is_paginated']
        })
        
        # Add SEO data from mixin  
        context.update(self.get_context_data(blogs=all_blogs, page=request.GET.get('page', 1)))
        return self.render_to_response(context)


class BlogDetailView(BlogDetailSEOMixin, DetailView):
    """
    Blog detail view for individual blog posts.
    Displays a specific blog post by slugified title.
    """
    template_name = 'blog/blog-detail.html'

    def get(self, request, title, *args, **kwargs):
        return self.handle_exceptions(lambda r, *a, **kw: self._get(r, title, *a, **kw))(request, *args, **kwargs)

    def _get(self, request, title, *args, **kwargs):
        # Get all blogs
        all_blogs = DataService.get_blogs()
        
        # Find blog by slug
        blog = self.get_item_by_slug(all_blogs, title, 'title')
        
        context = self.get_common_context()
        context['blog'] = blog
        
        # Add SEO data from mixin
        context.update(self.get_context_data(blog=blog))
        return self.render_to_response(context)
