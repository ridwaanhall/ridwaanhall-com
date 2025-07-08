"""
Core views for main portfolio pages.
Handles homepage, contact, and privacy policy views with proper SEO integration.
"""

import random
from django.utils import timezone
from django.http import HttpResponsePermanentRedirect

from apps.core.base_views import BaseView
from apps.data.data_service import DataService
from apps.seo.mixins import HomepageSEOMixin, ContactSEOMixin, PrivacyPolicySEOMixin


class HomeView(HomepageSEOMixin, BaseView):
    """
    Homepage view displaying key portfolio information.
    Shows recent blogs, featured projects, current experience, education, and skills.
    """
    template_name = 'core/home.html'

    def get(self, request, *args, **kwargs):
        return self.handle_exceptions(self._get)(request, *args, **kwargs)

    def _get(self, request, *args, **kwargs):
        about = self.get_about_data()
        
        skills = list(DataService.get_skills())
        skills_top, skills_middle, skills_bottom = (
            random.sample(skills, k=len(skills)) for _ in range(3)
        )
        
        context = {
            'view': True,
            'view_certs': True,
            'blogs': DataService.get_blogs()[:5],  # Latest 5 blogs
            'projects': DataService.get_projects()[:2],  # Top 2 featured projects
            'education': DataService.get_education(last_only=True),
            'experiences': DataService.get_experiences(current_only=True),
            'skills_top': skills_top,
            'skills_middle': skills_middle,
            'skills_bottom': skills_bottom,
            'about': about,
            'certifications': DataService.get_certifications(),
        }
        
        # Add SEO data from mixin
        context.update(self.get_context_data(**context))
        return self.render_to_response(context)


class ContactView(ContactSEOMixin, BaseView):
    """
    Contact page view with current time and contact information.
    """
    template_name = 'core/contact.html'

    def get(self, request, *args, **kwargs):
        return self.handle_exceptions(self._get)(request, *args, **kwargs)

    def _get(self, request, *args, **kwargs):
        about = self.get_about_data()
        context = {
            'view': True,
            'about': about,
            'current_time': timezone.localtime(timezone.now()),
        }
        
        # Add SEO data from mixin
        context.update(self.get_context_data(**context))
        return self.render_to_response(context)


class PrivacyPolicyView(PrivacyPolicySEOMixin, BaseView):
    """
    Privacy policy page view.
    """
    template_name = 'core/privacy-policy.html'

    def get(self, request, *args, **kwargs):
        return self.handle_exceptions(self._get)(request, *args, **kwargs)

    def _get(self, request, *args, **kwargs):
        about = self.get_about_data()
        context = {
            'about': about,
            'privacy_policy': DataService.get_privacy_policy(),
        }
        
        # Add SEO data from mixin
        context.update(self.get_context_data(**context))
        return self.render_to_response(context)


class CVRedirectView(BaseView):
    """
    Professional CV redirect view.
    Redirects to Google Drive CV document with a permanent redirect.
    """
    
    def get(self, request, *args, **kwargs):
        """
        Redirect to CV on Google Drive.
        Using permanent redirect (301) for better SEO and caching.
        """
        about_data = self.get_about_data()
        cv_url = about_data.get('cv')
        
        if not cv_url:
            # Fallback to homepage if CV URL is not configured
            return HttpResponsePermanentRedirect('/')
            
        return HttpResponsePermanentRedirect(cv_url)
    
    
class CVLatestRedirectView(BaseView):
    """
    CV Latest redirect view.
    """
    def get(self, request, *args, **kwargs):
        """
        Redirect to latest CV on Google Drive.
        Using permanent redirect (301) for better SEO and caching.
        """
        about_data = self.get_about_data()
        cv_latest_url = about_data.get('cv_latest')

        if not cv_latest_url:
            # Fallback to homepage if CV latest URL is not configured
            return HttpResponsePermanentRedirect('/')

        return HttpResponsePermanentRedirect(cv_latest_url)


class CVTemplateRedirectView(BaseView):
    """
    CV Template redirect view.
    Redirects to Google Docs CV template with a permanent redirect.
    """
    
    def get(self, request, *args, **kwargs):
        """
        Redirect to CV template on Google Docs.
        Using permanent redirect (301) for better SEO and caching.
        """
        about_data = self.get_about_data()
        template_url = about_data.get('cv_copy')
        
        if not template_url:
            # Fallback to homepage if CV template URL is not configured
            return HttpResponsePermanentRedirect('/')
            
        return HttpResponsePermanentRedirect(template_url)