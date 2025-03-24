from django.views.generic import TemplateView
from django.shortcuts import render

from apps.data.experiences_data import ExperiencesData
from apps.data import blog_data
from apps.data import projects_data
from apps.data.education_data import EducationData

class HomeView(TemplateView):
    def get(self, request):
        try:
            blogs = [blog for blog in blog_data.BlogData.blogs if blog.get('is_featured')]
            projects = [project for project in projects_data.ProjectsData.projects if project.get('is_featured')]
            education = [education for education in EducationData.education if education.get('is_last')]
            
            context = {
                'blogs': blogs,
                'projects': projects,
                'education': education,
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
    def get(self, request):
        try:
            experiences = [experience for experience in ExperiencesData.experiences if experience.get('is_current')]
            education = [education for education in EducationData.education if education.get('is_last')]
            context = {
                'experiences': experiences,
                'education': education,
            }
            
            return render(request, 'core/about.html', context)

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
    
class ContactView(TemplateView):
    template_name = 'core/contact.html'
