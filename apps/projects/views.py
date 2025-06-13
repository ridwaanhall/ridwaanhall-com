"""
Projects views for listing and displaying project details.
Handles project listing with pagination and individual project details.
"""

from apps.core.base_views import PaginatedView, DetailView
from apps.data.data_service import DataService
from apps.seo.mixins import ProjectsListSEOMixin, ProjectDetailSEOMixin


class ProjectsView(ProjectsListSEOMixin, PaginatedView):
    """
    Projects listing view with pagination.
    Displays all projects sorted by featured status and ID.
    """
    template_name = 'projects/projects.html'
    items_per_page = 6

    def get(self, request, *args, **kwargs):
        return self.handle_exceptions(self._get)(request, *args, **kwargs)

    def _get(self, request, *args, **kwargs):
        # Get all projects sorted by featured status and ID
        all_projects = DataService.get_projects()

        # Search filter
        search_query = request.GET.get('q', '').strip()
        if search_query:
            search_lower = search_query.lower()
            def match(project):
                return (
                    search_lower in project.get('title', '').lower() or
                    search_lower in project.get('headline', '').lower() or
                    any(search_lower in str(desc).lower() for desc in project.get('description', [])) or
                    search_lower in project.get('category', '').lower() or
                    any(search_lower in str(tag).lower() for tag in project.get('tags', []))
                )
            filtered_projects = list(filter(match, all_projects))
        else:
            filtered_projects = all_projects

        # Use the base class pagination method
        pagination_data = self.paginate_items(request, filtered_projects, self.items_per_page)
        context = self.get_common_context()
        context.update({
            'projects': pagination_data['page_obj'],  # This is the Django page object with pagination methods
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
        # Get SEO data without overriding the paginated projects
        seo_context = self.get_context_data(projects=filtered_projects, page=page_num)
        # Only add the 'seo' key, not the whole context which might override 'projects'
        if 'seo' in seo_context:
            context['seo'] = seo_context['seo']
        return self.render_to_response(context)


class ProjectsDetailView(ProjectDetailSEOMixin, DetailView):
    """
    Project detail view for individual projects.
    Displays detailed view for a specific project based on slugified title.
    """
    template_name = 'projects/projects-detail.html'

    def get(self, request, title, *args, **kwargs):
        return self.handle_exceptions(lambda r, *a, **kw: self._get(r, title, *a, **kw))(request, *args, **kwargs)

    def _get(self, request, title, *args, **kwargs):
        # Get all projects
        all_projects = DataService.get_projects()
        
        # Find project by slug
        project = self.get_item_by_slug(all_projects, title, 'title')
        
        context = self.get_common_context()
        context['project'] = project
        
        # Add SEO data from mixin
        context.update(self.get_context_data(project=project))
        return self.render_to_response(context)
