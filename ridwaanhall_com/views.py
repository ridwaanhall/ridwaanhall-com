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
    # Update path to where favicon is actually located
    favicon_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'favicon', 'favicon.ico')
    return FileResponse(open(favicon_path, 'rb'))