"""
Core views for main portfolio pages.
Handles homepage, contact, and privacy policy views with proper SEO integration.
"""

import random
from django.shortcuts import render
from django.utils import timezone

from apps.core.base_views import BaseView
from apps.core.data_service import DataService
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
        
        # Randomize skills for dynamic display
        skills_data = DataService.get_skills()
        skills_top = list(skills_data)
        random.shuffle(skills_top)
        skills_middle = list(skills_data)
        random.shuffle(skills_middle)
        skills_bottom = list(skills_data)
        random.shuffle(skills_bottom)
        
        context = {
            'view': True,
            'view_certs': True,
            'blogs': DataService.get_blogs()[:5],  # Latest 5 blogs
            'projects': DataService.get_projects()[:2],  # Top 2 featured projects
            'education': DataService.get_education(last_only=True),
            'experiences': DataService.get_experiences(current_only=True),
            'services': DataService.get_services(),
            'skills_top': skills_top,
            'skills_middle': skills_middle,
            'skills_bottom': skills_bottom,
            'about': about,
            'certifications': DataService.get_certifications(),
        }
        
        # Add SEO data from mixin
        context.update(self.get_context_data(**context))
        return render(request, self.template_name, context)


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
        return render(request, self.template_name, context)


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
        return render(request, self.template_name, context)