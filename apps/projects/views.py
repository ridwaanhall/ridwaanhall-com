"""
Projects views for listing and displaying project details.
Handles project listing with pagination and individual project details.
"""

from django.conf import settings

from apps.core.base_views import DetailView, PaginatedView
from apps.core.content_manager import ContentManager
from apps.core.data_service import DataService
from apps.projects.models import Project
from apps.seo.mixins import ProjectDetailSEOMixin, ProjectsListSEOMixin


class ProjectsView(ProjectsListSEOMixin, PaginatedView):
    """
    Projects listing view with pagination.
    Displays all projects sorted by featured status and ID.
    """
    template_name = 'projects/projects.html'

    def _get(self, request, *args, **kwargs):
        # Sort by status lifecycle first, then by newest creation date within each status.
        all_projects = DataService.get_projects(sort_by_featured=True, sort_by_status=True)

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
    template_name = 'projects/projects_detail.html'

    def _get(self, request, title, *args, **kwargs):
        # Resolve against the cached project list rather than re-querying a row
        # the manager already holds in memory.
        project = self.find_by_slug(ContentManager.get_projects(), title)

        context = self.get_common_context()
        context['project'] = project

        if getattr(settings, 'GUESTBOOK_PAGE', True):
            from apps.comments.context import comment_context
            context.update(comment_context(request, Project, project['id'], 'projects.project'))

        # Add SEO data from mixin
        context.update(self.get_context_data(project=project))
        return self.render_to_response(context)
