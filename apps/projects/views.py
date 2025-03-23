from django.views.generic import TemplateView, View
from django.shortcuts import render
from django.core.exceptions import SuspiciousOperation
from django.utils.text import slugify

from . import projects_data

class ProjectsView(TemplateView):
    def get(self, request):
        try:
            projects = projects_data.ProjectsData.projects
            context = {
                'projects': projects
            }
            return render(request, 'projects/projects.html', context)

        except AttributeError as e:
            context = {
                'error_code': 500,
                'error_message': f'AttributeError: {e}'
            }
            return render(request, 'error.html', context, status=500)
        except (TypeError, KeyError) as e:
            context = {
                'error_code': 500,
                'error_message': f'Data Error: {e}'
            }
            return render(request, 'error.html', context, status=500)
        except (FileNotFoundError, ImportError) as e:
            context = {
                'error_code': 500,
                'error_message': f'Module Error: {e}'
            }
            return render(request, 'error.html', context, status=500)
        except Exception as e:
            context = {
                'error_code': 500,
                'error_message': f'Unexpected Error: {e}'
            }
            return render(request, 'error.html', context, status=500)
    
class ProjectsDetailView(View):
    def get(self, request, title):
        projects = projects_data.ProjectsData.projects

        try:
            if not isinstance(title, str):
                raise SuspiciousOperation("Invalid title format")

            projects_post = next((item for item in projects if slugify(item['title']) == title), None)
            other_projects = [item for item in projects if slugify(item['title']) != title]

            if projects_post:
                context = {
                    'project': projects_post,
                    'other_projects': other_projects
                }
                return render(request, 'projects/projects_detail.html', context)
            else:
                context = {
                    'error_code': 404
                }
                return render(request, 'error.html', context, status=404)

        except SuspiciousOperation as e:
            context = {
                'error_code': 400
            }
            return render(request, 'error.html', context, status=400)
        except Exception as e:
            context = {
                'error_code': 500
            }
            return render(request, 'error.html', context, status=500)