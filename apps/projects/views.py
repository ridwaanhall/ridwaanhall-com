from django.views.generic import TemplateView
from django.shortcuts import render

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
    
class ProjectsDetailView(TemplateView):
    template_name = 'projects/projects_detail.html'