from django.views.generic import TemplateView
from django.shortcuts import render
from django.utils.text import slugify
from django.http import Http404
from django.core.exceptions import SuspiciousOperation

from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from apps.data.projects_data import ProjectsData
from apps.data.about_data import AboutData
from apps.seo.mixins import ProjectsListSEOMixin, ProjectDetailSEOMixin


class BaseProjectsView(TemplateView):
    """
    Base view for project-related pages.
    Handles common context, SEO generation, and error rendering.
    """

    def get_about(self):
        return AboutData.get_about_data()[0]

    def get_projects(self):
        return sorted(ProjectsData.projects, key=lambda p: (-p.get('is_featured', 0), -p.get('id', 0)))

    def get_common_context(self):
        return {
            'projects': self.get_projects(),
            'about': self.get_about()
        }

    def render_error(self, request, status_code, message=None):
        context = {'error_code': status_code}
        if message:
            context['error_message'] = message
        return render(request, 'error.html', context, status=status_code)

    def handle_exceptions(self, func):
        def wrapper(request, *args, **kwargs):
            try:
                return func(request, *args, **kwargs)
            except SuspiciousOperation:
                return self.render_error(request, 400)
            except (AttributeError, TypeError, KeyError):
                return self.render_error(request, 500, 'Data processing error occurred.')
            except (FileNotFoundError, ImportError):
                return self.render_error(request, 500, 'Resource loading error occurred.')
            except Exception:
                return self.render_error(request, 500, 'An unexpected error occurred.')
        return wrapper


class ProjectsView(ProjectsListSEOMixin, BaseProjectsView):
    """
    Displays all projects with SEO metadata.
    """
    template_name = 'projects/projects.html'
    projects_per_page = 6

    def get(self, request, *args, **kwargs):
        return self.handle_exceptions(self._get)(request, *args, **kwargs)

    def _get(self, request, *args, **kwargs):
        context = self.get_common_context()
        all_projects = context['projects']

        # Paginate projects
        paginator = Paginator(all_projects, self.projects_per_page)
        page = request.GET.get('page', 1)
        
        try:
            projects_page = paginator.page(page)
        except PageNotAnInteger:
            projects_page = paginator.page(1)
        except EmptyPage:
            projects_page = paginator.page(paginator.num_pages)
        
        # Update context with paginated projects
        context['projects'] = projects_page
        context['paginator'] = paginator
        context['is_paginated'] = paginator.num_pages > 1

        # SEO data is handled by the mixin
        context.update(self.get_context_data(projects=all_projects, page=page))
        return self.render_to_response(context)


class ProjectsDetailView(ProjectDetailSEOMixin, BaseProjectsView):
    """
    Displays detailed view for a specific project based on slugified title.
    """
    template_name = 'projects/projects-detail.html'

    def get(self, request, title, *args, **kwargs):
        return self.handle_exceptions(lambda r, *a, **kw: self._get(r, title, *a, **kw))(request, *args, **kwargs)

    def _get(self, request, title, *args, **kwargs):
        if not isinstance(title, str):
            raise SuspiciousOperation("Invalid project title format")

        context = self.get_common_context()

        project = next(
            (p for p in context['projects'] if slugify(p['title']) == title),
            None
        )

        if not project:
            raise Http404("Project not found")

        context['project'] = project
        # SEO data is handled by the mixin
        context.update(self.get_context_data(project=project))
        return self.render_to_response(context)
