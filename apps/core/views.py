from django.views.generic import TemplateView
from django.shortcuts import render
from apps.blog import blog_data

class HomeView(TemplateView):
    def get(self, request):
        try:
            blogs = [blog for blog in blog_data.BlogData.blogs if blog.get('is_featured')]
            context = {
                'blogs': blogs
            }
            return render(request, 'core/home.html', context)

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

class AboutView(TemplateView):
    template_name = 'core/about.html'
    
class ContactView(TemplateView):
    template_name = 'core/contact.html'
