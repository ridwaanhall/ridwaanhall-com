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
from apps.data.palestine_data import PalestineData
from apps.data.privacy_policy_data import PrivacyPolicyData
from apps.data.skills_data import SkillsData
import random

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
        # Get skills data and shuffle it for random display
        skills_top = list(SkillsData.skills)
        random.shuffle(skills_top)
        skills_middle = list(SkillsData.skills)
        random.shuffle(skills_middle)
        skills_bottom = list(SkillsData.skills)
        random.shuffle(skills_bottom)
        
        context = {
            'view': True,
            'view_certs': True,
            'blogs': sorted(BlogData.blogs, key=lambda blog: -blog.get('id', 0))[:5],
            'projects': sorted(ProjectsData.projects, key=lambda p: (not -p.get('is_featured', False), -p.get('id', 0)))[:2],
            'education': [edu for edu in EducationData.education if edu.get('is_last')],
            'experiences': [exp for exp in ExperiencesData.experiences if exp.get('is_current')],
            'services': ServicesData.services,
            'skills_top': skills_top,
            'skills_middle': skills_middle,
            'skills_bottom': skills_bottom,
            'about': about,
            'certifications': CertificationsData.certifications,
            'seo': self.get_seo_data(
            title=f"Hey, I'm {about['name']} - Welcome to My World",
            description=f"This is {about['username']}'s corner of the internet! {about.get('short_description', 'A place where I share my projects, ideas, and journey.')}",
            keywords=f"{about['username']}, portfolio, coder, projects, blogs, skills, learning, ai engineer, web developer, machine learning engineer, dbs foundation coding camp mentor, django, python, pytorch",
            twitter_card='summary_large_image'
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
                title=f"Hit Me Up - Connect with {about['username']}",
                description=f"Wanna chat? Reach out to {about['username']} for collabs, gigs, or just to say hi!",
                keywords=f"{about['username']}, machine learning enineer in indonesia, web developer in indonesia, contact, connect, reach out, chat, collab",
            ),
        }
        return render(request, self.template_name, context)

class PrivacyPolicyView(BasePortfolioView):
    template_name = 'core/privacy-policy.html'

    def get(self, request, *args, **kwargs):
        return self.handle_exceptions(self._get)(request, *args, **kwargs)

    def _get(self, request, *args, **kwargs):
        about = self.get_about_data()
        context = {
            'about': about,
            'privacy_policy': PrivacyPolicyData.privacy_policy,
            'seo': self.get_seo_data(
                title="Privacy Stuff - Keeping it chill and transparent!",
                description="We got you! Check out how we keep your data safe and sound.",
                keywords=f"{about['username']}, privacy vibes, data safety, your rights",
            ),
        }
        return render(request, self.template_name, context)