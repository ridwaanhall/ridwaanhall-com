from django.shortcuts import render, get_object_or_404
from .utils import get_projects, get_project_by_id

def project_list(request):
    projects = get_projects()
    context = {
        'projects': projects
    }
    return render(request, 'projects/project_list.html', context)

def project_detail(request, project_id):
    project = get_project_by_id(project_id)
    if not project:
        from django.http import Http404
        raise Http404("Project does not exist")
        
    context = {
        'project': project
    }
    return render(request, 'projects/project_detail.html', context)