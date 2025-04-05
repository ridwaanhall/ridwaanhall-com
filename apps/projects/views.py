from django.views.generic import TemplateView
from django.shortcuts import render
from django.utils.text import slugify
from django.http import Http404
from django.core.exceptions import SuspiciousOperation

from apps.data.projects_data import ProjectsData
from apps.data.about_data import AboutData


class BaseProjectsView(TemplateView):
    """
    Base view for project-related pages.
    Handles common context, SEO generation, and error rendering.
    """

    def get_about(self):
        return AboutData.get_about_data()[0]

    def get_projects(self):
        # Featured projects will appear first
        return sorted(ProjectsData.projects, key=lambda p: not p.get('is_featured', False))

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


class ProjectsView(BaseProjectsView):
    """
    Displays all projects with SEO metadata.
    """
    template_name = 'projects/projects.html'

    def get(self, request, *args, **kwargs):
        return self.handle_exceptions(self._get)(request, *args, **kwargs)

    def _get(self, request, *args, **kwargs):
        context = self.get_common_context()
        about = context['about']
        projects = context['projects']

        # Generate tech stack keywords from all projects
        tech_stack_keywords = list(set([
            tech['name']
            for project in projects
            for tech in project.get('tech_stack', [])
        ]))[:10]

        context['seo'] = {
            'title': f"Projects & Portfolio | {about['name']} - Developer Showcase",
            'description': f"Explore {about['name']}'s development projects, applications, and coding portfolio. View demos and source code.",
            'keywords': f"{about['name']}, projects, portfolio, developer, applications, demos, github, code samples, {', '.join(tech_stack_keywords)}",
            'og_image': projects[0].get('image_url') if projects else about.get('image_url', ''),
            'og_type': 'website',
            'twitter_card': 'summary_large_image',
        }

        return self.render_to_response(context)


class ProjectsDetailView(BaseProjectsView):
    """
    Displays detailed view for a specific project based on slugified title.
    """
    template_name = 'projects/projects_detail.html'

    def get(self, request, title, *args, **kwargs):
        return self.handle_exceptions(lambda r, *a, **kw: self._get(r, title, *a, **kw))(request, *args, **kwargs)

    def _get(self, request, title, *args, **kwargs):
        if not isinstance(title, str):
            raise SuspiciousOperation("Invalid project title format")

        context = self.get_common_context()
        about = context['about']

        project = next(
            (p for p in context['projects'] if slugify(p['title']) == title),
            None
        )

        if not project:
            raise Http404("Project not found")

        context['project'] = project
        context['seo'] = {
            'title': f"{project['title']} | {about['name']} - Project Details",
            'description': project.get('headline', ''),
            'keywords': f"{project['title']}, {about['name']}, {', '.join(tech['name'] for tech in project.get('tech_stack', []))}",
            'og_image': project.get('image_url', about.get('image_url', '')),
            'og_type': 'article',
            'twitter_card': 'summary_large_image',
        }

        return self.render_to_response(context)
