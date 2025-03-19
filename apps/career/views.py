from django.shortcuts import render
from .utils import get_jobs

def career_list(request):
    jobs = get_jobs()
    context = {
        'jobs': jobs
    }
    return render(request, 'career/career_list.html', context)