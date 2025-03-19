from django.shortcuts import render
from .utils import get_certifications

def certifications_list(request):
    certifications = get_certifications()
    context = {
        'certifications': certifications
    }
    return render(request, 'lic_certs/certifications_list.html', context)