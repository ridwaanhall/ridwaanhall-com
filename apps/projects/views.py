from django.views.generic import TemplateView, View
from django.shortcuts import render
from django.core.exceptions import SuspiciousOperation
from django.utils.text import slugify

from apps.data.projects_data import ProjectsData
from apps.data.about_data import AboutData

class ProjectsView(TemplateView):
    def get(self, request):
        try:
            projects = ProjectsData.projects
            about = AboutData.get_about_data()
            
            context = {
                'projects': projects,
                'about': about[0]
            }
            return render(request, 'projects/projects.html', context)

        except AttributeError:
            context = {
                'error_code': 500,
                'error_message': 'Internal server error occurred. Please try again later.'
            }
            return render(request, 'error.html', context, status=500)
        except (TypeError, KeyError):
            context = {
                'error_code': 500,
                'error_message': 'Data processing error occurred. Please try again later.'
            }
            return render(request, 'error.html', context, status=500)
        except (FileNotFoundError, ImportError):
            context = {
                'error_code': 500,
                'error_message': 'Resource loading error occurred. Please try again later.'
            }
            return render(request, 'error.html', context, status=500)
        except Exception:
            context = {
                'error_code': 500,
                'error_message': 'An unexpected error occurred. Please try again later.'
            }
            return render(request, 'error.html', context, status=500)
    
class ProjectsDetailView(View):
    def get(self, request, title):
        projects = ProjectsData.projects
        about = AboutData.get_about_data()

        try:
            if not isinstance(title, str):
                raise SuspiciousOperation("Invalid title format")

            projects_post = next((item for item in projects if slugify(item['title']) == title), None)
            # other_projects = [item for item in projects if slugify(item['title']) != title]

            if projects_post:
                context = {
                    'project': projects_post,
                    'about': about[0],
                    # 'other_projects': other_projects
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