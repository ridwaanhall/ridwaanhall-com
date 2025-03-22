from django.views.generic import TemplateView

class ProjectsView(TemplateView):
    template_name = 'projects/projects.html'