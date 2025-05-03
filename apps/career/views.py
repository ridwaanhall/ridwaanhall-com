from django.views.generic import TemplateView
from django.shortcuts import render
from django.core.exceptions import SuspiciousOperation

from apps.data.experiences_data import ExperiencesData
from apps.data.certifications_data import CertificationsData
from apps.data.education_data import EducationData
from apps.data.applications_data import ApplicationsData
from apps.data.awards_data import AwardsData
from apps.data.about_data import AboutData


class BaseCareerView(TemplateView):
    """
    Base view for career-related pages.
    Provides about data, error rendering, and exception handling.
    """

    def get_about(self):
        return AboutData.get_about_data()[0]

    def get_common_context(self):
        return {
            'about': self.get_about()
        }

    def render_error(self, request, status_code, message=None):
        context = {'error_code': status_code}
        if message:
            context['error_message'] = message
        return render(request, 'error.html', context, status=status_code)

    def handle_exceptions(self, func):
        """
        Decorator-like method to handle exceptions in views.
        """
        def wrapper(request, *args, **kwargs):
            try:
                return func(request, *args, **kwargs)
            except SuspiciousOperation:
                return self.render_error(request, 400)
            except (AttributeError, TypeError, KeyError):
                return self.render_error(request, 500, 'Data processing error occurred.')
            except (FileNotFoundError, ImportError):
                return self.render_error(request, 500, 'Resource loading error occurred.')
            except Exception:
                return self.render_error(request, 500, 'An unexpected error occurred.')
        return wrapper


class CareerView(BaseCareerView):
    """
    Displays the career/resume page with experiences, education, and certifications.
    """
    template_name = 'career/career.html'

    def get(self, request, *args, **kwargs):
        return self.handle_exceptions(self._get)(request, *args, **kwargs)

    def _get(self, request, *args, **kwargs):
        context = self.get_common_context()
        about = context['about']

        awards_sorted = sorted(AwardsData.awards, key=lambda x: x.get('id', 0), reverse=True)

        context.update({
            'view_certs': 'true',
            'view': False,
            'experiences': ExperiencesData.experiences,
            'education': EducationData.education,
            'certifications': CertificationsData.certifications,
            'applications': ApplicationsData.applications,
            'awards': awards_sorted,
            'seo': {
            'title': f"{about['name']}'s Journey - My Career Story",
            'description': f"Dive into {about['name']}’s epic ride—killer work gigs, education adventures, slick certifications, stellar honors & bold awards, and the wild tales from every interview and opportunity I’ve crushed.",
            'keywords': f"{about['name']}, career, work, skills, experience, growth, certifications, stellar honors & bold awards, applications",
            'og_image': about.get('image_url', ''),
            'og_type': 'profile',
            'twitter_card': 'summary_large_image',
        }
        })

        return self.render_to_response(context)
