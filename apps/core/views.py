from django.shortcuts import render
from apps.core.utils import load_json_data
# Ensure the module exists or correct the import path
from apps.projects.utils import get_featured_projects

def home(request):
    personal_info = load_json_data('core', 'personal_info.json')
    featured_projects = get_featured_projects()
    
    context = {
        'personal_info': personal_info,
        'featured_projects': featured_projects,
    }
    return render(request, 'core/home.html', context)

def about(request):
    personal_info = load_json_data('core', 'personal_info.json')
    context = {
        'personal_info': personal_info,
    }
    return render(request, 'core/about.html', context)

def contact(request):
    personal_info = load_json_data('core', 'personal_info.json')
    context = {
        'personal_info': personal_info,
    }
    return render(request, 'core/contact.html', context)