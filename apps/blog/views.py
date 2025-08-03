"""
Blog views for listing and displaying blog posts.
Handles blog listing with pagination and individual blog post details.
"""

from apps.core.base_views import PaginatedView, DetailView
from apps.data.data_service import DataService
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

        # Search filter
        search_query = request.GET.get('q', '').strip()
        if search_query:
            search_lower = search_query.lower()
            def match(blog):
                return (
                    search_lower in blog.get('title', '').lower() or
                    search_lower in blog.get('description', '').lower() or
                    search_lower in blog.get('author', '').lower() or
                    any(search_lower in str(tag).lower() for tag in blog.get('tags', []))
                )
            filtered_blogs = list(filter(match, all_blogs))
        else:
            filtered_blogs = all_blogs
        
        # Use the base class pagination method
        pagination_data = self.paginate_items(request, filtered_blogs, self.items_per_page)
        
        # Get featured blogs
        featured_blogs = DataService.get_blogs(featured_only=True)[:5]
        context = self.get_common_context()
        context.update({
            'blogs': pagination_data['page_obj'],  # This is the Django page object with pagination methods
            'featured_blogs': featured_blogs,
            'paginator': pagination_data['paginator'],
            'is_paginated': pagination_data['is_paginated'],
            'page_range': pagination_data['page_range'],
            'search_query': search_query,
        })
          
        # Add SEO data from mixin
        try:
            page_num = int(request.GET.get('page', 1))
        except (ValueError, TypeError):
            page_num = 1
        
        # Get SEO data without overriding the paginated blogs
        seo_context = self.get_context_data(blogs=filtered_blogs, page=page_num)
        # Only add the 'seo' key, not the whole context which might override 'blogs'
        if 'seo' in seo_context:
            context['seo'] = seo_context['seo']
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
