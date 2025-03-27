from django.views.generic import TemplateView
from django.shortcuts import render
from django.utils import timezone

from apps.data.about_data import AboutData
from apps.data.experiences_data import ExperiencesData
from apps.data.blog_data import BlogData
from apps.data.projects_data import ProjectsData
from apps.data.education_data import EducationData
from apps.data.certifications_data import CertificationsData


class BasePortfolioView(TemplateView):
    """Base view for portfolio pages with common error handling and data access."""
    
    def get_about_data(self):
        """Get about data safely."""
        return AboutData.get_about_data()[0]
        
    def get_seo_data(self, title, description, keywords, og_type='website', twitter_card='summary'):
        """Generate consistent SEO metadata."""
        about = self.get_about_data()
        return {
            'title': title,
            'description': description,
            'keywords': keywords,
            'og_image': about.get('image_url', ''),
            'og_type': og_type,
            'twitter_card': twitter_card,
        }
    
    def render_with_error_handling(self, request, template_name, context):
        """Render template with standardized error handling."""
        try:
            return render(request, template_name, context)
        except AttributeError:
            return self.render_error(request, 'Internal server error occurred.')
        except (TypeError, KeyError):
            return self.render_error(request, 'Data processing error occurred.')
        except (FileNotFoundError, ImportError):
            return self.render_error(request, 'Resource loading error occurred.')
        except Exception:
            return self.render_error(request, 'An unexpected error occurred.')
    
    def render_error(self, request, message):
        """Render error page with consistent formatting."""
        context = {
            'error_code': 500,
            'error_message': f'{message} Please try again later.'
        }
        return render(request, 'error.html', context, status=500)


class HomeView(BasePortfolioView):
    template_name = 'core/home.html'
    
    def get(self, request, *args, **kwargs):
        about = self.get_about_data()
        
        context = {
            'view': True,
            'view_certs': True,
            'blogs': [blog for blog in BlogData.blogs if blog.get('is_featured')],
            'projects': [project for project in ProjectsData.projects if project.get('is_featured')],
            'education': [edu for edu in EducationData.education if edu.get('is_last')],
            'experiences': [exp for exp in ExperiencesData.experiences if exp.get('is_current')],
            'about': about,
            'certifications': CertificationsData.certifications,
            'seo': self.get_seo_data(
                title=f"{about['name']} - Portfolio and Personal Website",
                description=f"Portfolio and personal website of {about['name']}. {about.get('short_description', '')}",
                keywords=f"{about['name']}, portfolio, developer, projects, blogs, certifications, education, experiences, ridwaanhall",
                twitter_card='summary_large_image'
            ),
        }
        
        return self.render_with_error_handling(request, self.template_name, context)


class AboutView(BasePortfolioView):
    template_name = 'core/about.html'
    
    def get(self, request, *args, **kwargs):
        about = self.get_about_data()
        
        context = {
            'view': True,
            'experiences': [exp for exp in ExperiencesData.experiences if exp.get('is_current')],
            'education': [edu for edu in EducationData.education if edu.get('is_last')],
            'about': about,
            'seo': self.get_seo_data(
                title=f"About {about['name']} - Background and Experience",
                description=f"Learn about {about['name']}'s professional background, skills, and experience. {about.get('short_description', '')}",
                keywords=f"{about['name']}, about, background, skills, experience, education, career",
                og_type='profile'
            ),
        }
        
        return self.render_with_error_handling(request, self.template_name, context)


class ContactView(BasePortfolioView):
    template_name = 'core/contact.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        about = self.get_about_data()
        
        context.update({
            'view': True,
            'about': about,
            'current_time': timezone.localtime(timezone.now()),
            'seo': self.get_seo_data(
                title=f"Contact {about['name']} - Get in Touch",
                description=f"Contact {about['name']} for collaboration, job opportunities, or consulting. Get in touch today!",
                keywords=f"{about['name']}, contact, get in touch, email, message, connect"
            ),
        })
        
        return context
        
    def get(self, request, *args, **kwargs):
        context = self.get_context_data(**kwargs)
        return self.render_with_error_handling(request, self.template_name, context)
