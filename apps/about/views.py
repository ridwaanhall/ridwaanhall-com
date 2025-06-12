"""
About views for displaying about page with experiences, education, and certifications.
Provides comprehensive portfolio information with proper error handling.
"""

from apps.core.base_views import BaseView
from apps.data.data_service import DataService
from apps.seo.mixins import AboutSEOMixin


class AboutView(AboutSEOMixin, BaseView):
    """
    About page view displaying comprehensive portfolio information.
    Shows experiences, education, certifications, applications, and awards.
    """
    template_name = 'about/about.html'

    def get(self, request, *args, **kwargs):
        return self.handle_exceptions(self._get)(request, *args, **kwargs)

    def _get(self, request, *args, **kwargs):
        about = self.get_about_data()

        context = {
            'about': about,
            'view_certs': 'true',
            'view': False,
            'experiences': DataService.get_experiences(),
            'education': DataService.get_education(),
            'certifications': DataService.get_certifications(),
            'applications': DataService.get_applications(),
            'awards': DataService.get_awards(),  # Already sorted by ID descending
        }

        # Add SEO data from mixin
        context.update(self.get_context_data(**context))
        return self.render_to_response(context)
