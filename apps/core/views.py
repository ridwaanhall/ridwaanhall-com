from django.views.generic import TemplateView
from django.shortcuts import render

from apps.data.experiences_data import ExperiencesData
from apps.data import blog_data
from apps.data import projects_data
from apps.data.education_data import EducationData
from apps.data.experiences_data import ExperiencesData

class HomeView(TemplateView):
    def get(self, request):
        try:
            blogs = [blog for blog in blog_data.BlogData.blogs if blog.get('is_featured')]
            projects = [project for project in projects_data.ProjectsData.projects if project.get('is_featured')]
            education = [education for education in EducationData.education if education.get('is_last')]
            experiences = [experience for experience in ExperiencesData.experiences if experience.get('is_current')]
            
            context = {
                'view': True,
                'blogs': blogs,
                'projects': projects,
                'education': education,
                'experiences': experiences
            }
            
            return render(request, 'core/home.html', context)

        except AttributeError:
            context = {
                'error_code': 500,
                'error_message': 'Internal server error occurred. Please try again later.'
            }
            return render(request, 'error.html', context, status=500)
        except (TypeError, KeyError):
            context = {
                'error_code': 500,
                'error_message': 'Data processing error occurred. Please try again later.'
            }
            return render(request, 'error.html', context, status=500)
        except (FileNotFoundError, ImportError):
            context = {
                'error_code': 500,
                'error_message': 'Resource loading error occurred. Please try again later.'
            }
            return render(request, 'error.html', context, status=500)
        except Exception:
            context = {
                'error_code': 500,
                'error_message': 'An unexpected error occurred. Please try again later.'
            }
            return render(request, 'error.html', context, status=500)

class AboutView(TemplateView):
    def get(self, request):
        try:
            experiences = [experience for experience in ExperiencesData.experiences if experience.get('is_current')]
            education = [education for education in EducationData.education if education.get('is_last')]
            
            context = {
                'view': True,
                'experiences': experiences,
                'education': education,
            }
            
            return render(request, 'core/about.html', context)

        except AttributeError:
            context = {
                'error_code': 500,
                'error_message': 'Internal server error occurred. Please try again later.'
            }
            return render(request, 'error.html', context, status=500)
        except (TypeError, KeyError):
            context = {
                'error_code': 500,
                'error_message': 'Data processing error occurred. Please try again later.'
            }
            return render(request, 'error.html', context, status=500)
        except (FileNotFoundError, ImportError):
            context = {
                'error_code': 500,
                'error_message': 'Resource loading error occurred. Please try again later.'
            }
            return render(request, 'error.html', context, status=500)
        except Exception:
            context = {
                'error_code': 500,
                'error_message': 'An unexpected error occurred. Please try again later.'
            }
            return render(request, 'error.html', context, status=500)
    
class ContactView(TemplateView):
    template_name = 'core/contact.html'
