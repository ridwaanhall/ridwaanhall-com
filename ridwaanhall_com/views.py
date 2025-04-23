from django.shortcuts import render
from django.views import View
from django.http import FileResponse
import os

class CatchAllView(View):
    def get(self, request, *args, **kwargs):
        context = {
            'error_code': 404
        }
        return render(request, 'error.html', context, status=404)

def favicon_view(request):
    favicon_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'staticfiles', 'favicon', 'favicon.ico')
    
    if os.path.exists(favicon_path):
        return FileResponse(open(favicon_path, 'rb'))
    
    context = {'error_code': 404}
    return render(request, 'error.html', context, status=404)