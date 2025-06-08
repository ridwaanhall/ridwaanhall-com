"""
Projects views for listing and displaying project details.
Handles project listing with pagination and individual project details.
"""

from django.utils.text import slugify
from django.http import Http404
from django.core.exceptions import SuspiciousOperation

from apps.core.base_views import PaginatedView, DetailView
from apps.core.data_service import DataService
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
        
        # Paginate projects
        pagination_data = self.paginate_items(request, all_projects, self.items_per_page)
        
        context = self.get_common_context()
        context.update({
            'projects': pagination_data['page_obj'],
            'paginator': pagination_data['paginator'],
            'is_paginated': pagination_data['is_paginated']
        })

        # Add SEO data from mixin
        context.update(self.get_context_data(projects=all_projects, page=request.GET.get('page', 1)))
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
