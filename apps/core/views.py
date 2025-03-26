from django.views.generic import TemplateView
from django.shortcuts import render

from apps.data.about_data import AboutData
from apps.data.experiences_data import ExperiencesData
from apps.data.blog_data import BlogData
from apps.data.projects_data import ProjectsData
from apps.data.education_data import EducationData
from apps.data.experiences_data import ExperiencesData
from apps.data.certifications_data import CertificationsData

class HomeView(TemplateView):
    def get(self, request):
        try:
            about = AboutData.get_about_data()
            blogs = [blog for blog in BlogData.blogs if blog.get('is_featured')]
            projects = [project for project in ProjectsData.projects if project.get('is_featured')]
            education = [education for education in EducationData.education if education.get('is_last')]
            experiences = [experience for experience in ExperiencesData.experiences if experience.get('is_current')]
            certifications = [certification for certification in CertificationsData.certifications]
            
            seo = {
                'title': f"{about[0]['name']} - Portfolio and Personal Website",
                'description': f"Portfolio and personal website of {about[0]['name']}. {about[0].get('short_description', '')}",
                'keywords': f"{about[0]['name']}, portfolio, developer, projects, blogs, certifications, education, experiences, ridwaanhall",
                'og_image': about[0].get('image_url', ''),
                'og_type': 'website',
                'twitter_card': 'summary_large_image',
            }
            
            context = {
                'view': True,
                'view_certs': True,
                'blogs': blogs,
                'projects': projects,
                'education': education,
                'experiences': experiences,
                'about': about[0],
                'certifications': certifications,
                'seo': seo,
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
            about = AboutData.get_about_data()
            experiences = [experience for experience in ExperiencesData.experiences if experience.get('is_current')]
            education = [education for education in EducationData.education if education.get('is_last')]
            
            seo = {
                'title': f"About {about[0]['name']} - Background and Experience",
                'description': f"Learn about {about[0]['name']}'s professional background, skills, and experience. {about[0].get('short_description', '')}",
                'keywords': f"{about[0]['name']}, about, background, skills, experience, education, career",
                'og_image': about[0].get('image_url', ''),
                'og_type': 'profile',
                'twitter_card': 'summary',
            }
            
            context = {
                'view': True,
                'experiences': experiences,
                'education': education,
                'about': about[0],
                'seo': seo,
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
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        about = AboutData.get_about_data()
        
        seo = {
            'title': f"Contact {about[0]['name']} - Get in Touch",
            'description': f"Contact {about[0]['name']} for collaboration, job opportunities, or consulting. Get in touch today!",
            'keywords': f"{about[0]['name']}, contact, get in touch, email, message, connect",
            'og_image': about[0].get('image_url', ''),
            'og_type': 'website',
            'twitter_card': 'summary',
        }
        
        context['about'] = about[0]
        context['seo'] = seo
        context['view'] = True
        
        return context