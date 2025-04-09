from django.views.generic import TemplateView
from django.shortcuts import render
from django.utils import timezone

from apps.data.about_data import AboutData
from apps.data.experiences_data import ExperiencesData
from apps.data.blog_data import BlogData
from apps.data.projects_data import ProjectsData
from apps.data.education_data import EducationData
from apps.data.certifications_data import CertificationsData
from apps.data.services_data import ServicesData


class BasePortfolioView(TemplateView):
    """Base view for portfolio pages with common error handling and data access."""

    def get_about_data(self):
        """Safely get about data with fallback."""
        about_data = AboutData.get_about_data()
        if not about_data:
            raise FileNotFoundError("About data is missing.")
        return about_data[0]

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

    def render_error(self, request, message):
        """Render error page with consistent formatting."""
        context = {
            'error_code': 500,
            'error_message': f'{message} Please try again later.'
        }
        return render(request, 'error.html', context, status=500)

    def render_not_found(self, request, message="Page not found."):
        """Render 404 error page."""
        context = {
            'error_code': 404,
            'error_message': message
        }
        return render(request, 'error.html', context, status=404)

    def handle_exceptions(self, func):
        """Decorator to handle exceptions in views."""
        def wrapper(request, *args, **kwargs):
            try:
                return func(request, *args, **kwargs)
            except AttributeError:
                return self.render_error(request, 'Internal server error occurred.')
            except (TypeError, KeyError):
                return self.render_error(request, 'Data processing error occurred.')
            except (FileNotFoundError, ImportError):
                return self.render_error(request, 'Resource loading error occurred.')
            except Exception:
                return self.render_error(request, 'An unexpected error occurred.')
        return wrapper


class HomeView(BasePortfolioView):
    template_name = 'core/home.html'

    def get(self, request, *args, **kwargs):
        return self.handle_exceptions(self._get)(request, *args, **kwargs)

    def _get(self, request, *args, **kwargs):
        about = self.get_about_data()
        context = {
            'view': True,
            'view_certs': True,
            'blogs': [blog for blog in BlogData.blogs if blog.get('is_featured')][-2:],
            'projects': [project for project in ProjectsData.projects if project.get('is_featured')][-2:],
            'education': [edu for edu in EducationData.education if edu.get('is_last')],
            'experiences': [exp for exp in ExperiencesData.experiences if exp.get('is_current')],
            'services': ServicesData.services,
            'about': about,
            'certifications': CertificationsData.certifications,
            'seo': self.get_seo_data(
                title=f"{about['name']} - Portfolio and Personal Website",
                description=f"Portfolio and personal website of {about['username']}. {about.get('short_description', '')}",
                keywords=f"{about['username']}, {about['name']}, portfolio, developer, projects, blogs, certifications, education, experiences",
                twitter_card='summary_large_image'
            ),
        }
        return render(request, self.template_name, context)


class AboutView(BasePortfolioView):
    template_name = 'core/about.html'

    def get(self, request, *args, **kwargs):
        return self.handle_exceptions(self._get)(request, *args, **kwargs)

    def _get(self, request, *args, **kwargs):
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
        return render(request, self.template_name, context)


class ContactView(BasePortfolioView):
    template_name = 'core/contact.html'

    def get(self, request, *args, **kwargs):
        return self.handle_exceptions(self._get)(request, *args, **kwargs)

    def _get(self, request, *args, **kwargs):
        about = self.get_about_data()
        context = {
            'view': True,
            'about': about,
            'current_time': timezone.localtime(timezone.now()),
            'seo': self.get_seo_data(
                title=f"Contact {about['name']} - Get in Touch",
                description=f"Contact {about['name']} for collaboration, job opportunities, or consulting. Get in touch today!",
                keywords=f"{about['name']}, contact, get in touch, email, message, connect"
            ),
        }
        return render(request, self.template_name, context)
