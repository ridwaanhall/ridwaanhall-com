from django.shortcuts import render
from django.views import View

class CatchAllView(View):
    def get(self, request, *args, **kwargs):
        context = {
            'error_code': 404
        }
        return render(request, 'error.html', context, status=404)