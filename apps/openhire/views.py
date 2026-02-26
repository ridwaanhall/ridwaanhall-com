"""
OpenHire views for displaying open to work and hiring information.
Provides information about work availability and hiring opportunities.
"""

from apps.core.base_views import BaseView
from apps.core.data_service import DataService
from apps.seo.mixins import OpenHireSEOMixin


class OpenHireView(OpenHireSEOMixin, BaseView):
    """
    OpenHire page view displaying open to work and hiring information.
    Shows availability status and relevant opportunities.
    """
    template_name = 'openhire/openhire.html'

    def get(self, request, *args, **kwargs):
        return self.handle_exceptions(self._get)(request, *args, **kwargs)

    def _get(self, request, *args, **kwargs):
        about = self.get_about_data()
        
        # Check if the user should access this page
        if not (about.get('is_open_to_work') or about.get('is_hiring')):
            return self.handle_404()

        context = {
            'about': about,
            'open_to_work_data': DataService.get_open_to_work_data(),
            'hiring_data': DataService.get_hiring_data(),
        }

        # Add SEO data from mixin
        context.update(self.get_context_data(**context))
        return self.render_to_response(context)
