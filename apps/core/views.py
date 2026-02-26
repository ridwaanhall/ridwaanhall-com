"""
Core views for main portfolio pages.
Handles homepage, contact, and privacy policy views with proper SEO integration.
"""

import random
from django.utils import timezone
from django.http import HttpResponsePermanentRedirect, HttpResponseRedirect, HttpResponse, JsonResponse
from django.utils.encoding import iri_to_uri
import logging
from django.shortcuts import render
from django.conf import settings

from apps.core.base_views import BaseView
from apps.core.data_service import DataService
from apps.seo.mixins import HomepageSEOMixin, ContactSEOMixin, PrivacyPolicySEOMixin
from apps.core.forms import ContactForm
from apps.core.email_handler import send_contact_email
from apps.core.validators import TurnstileValidator


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
    Handles both GET and POST requests for contact form.
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
    
    def post(self, request, *args, **kwargs):
        """Handle contact form submission via AJAX"""
        try:
            # Verify Cloudflare Turnstile token (if enabled)
            if settings.USE_CF_TURNSTILE:
                turnstile_token = request.POST.get('cf-turnstile-response')
                if not TurnstileValidator.verify(turnstile_token):
                    return JsonResponse({
                        "success": False,
                        "message": "Security verification failed. Please try again."
                    }, status=400)
            
            form = ContactForm(request.POST)
            
            if form.is_valid():
                # Get cleaned data
                contact_data = {
                    "name": form.cleaned_data["name"],
                    "email": form.cleaned_data["email"],
                    "message": form.cleaned_data["message"],
                }
                
                # Send email
                email_sent = send_contact_email(contact_data)
                
                if email_sent:
                    return JsonResponse({
                        "success": True,
                        "message": "Thank you—your message has left a trace. I'll be in touch soon."
                    })
                else:
                    return JsonResponse({
                        "success": False,
                        "message": "Something went wrong while sending your message. Please try again."
                    }, status=500)
            else:
                # Return form errors
                errors = form.errors.as_json()
                return JsonResponse({
                    "success": False,
                    "message": "Please check your form data.",
                    "errors": errors
                }, status=400)
                
        except Exception as e:
            return JsonResponse({
                "success": False,
                "message": "An internal error has occurred!"
            }, status=500)


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
        cv_url = None
        if about_data:
            cv_url = about_data.get('cv', {}).get('main')
            if not cv_url:
                # Fallback to nested structure if not flattened (backward compatibility)
                cv_url = about_data.get('personal', {}).get('cv', {}).get('main')
        
        if not cv_url:
            # Fallback to homepage if CV URL is not configured
            return HttpResponsePermanentRedirect('/')
            
        # Encode to a proper URI and redirect via Location header (302)
        resp = HttpResponse(status=302)
        resp['Location'] = iri_to_uri(cv_url)
        return resp
    
    
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
        cv_latest_url = None
        if about_data:
            cv_latest_url = about_data.get('cv', {}).get('latest')
            if not cv_latest_url:
                # Fallback to nested structure if not flattened (backward compatibility)
                cv_latest_url = about_data.get('personal', {}).get('cv', {}).get('latest')

        if not cv_latest_url:
            # Fallback to homepage if CV latest URL is not configured
            return HttpResponsePermanentRedirect('/')

        resp = HttpResponse(status=302)
        resp['Location'] = iri_to_uri(cv_latest_url)
        return resp


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
        template_url = None
        if about_data:
            template_url = about_data.get('cv', {}).get('copy')
            if not template_url:
                # Fallback to nested structure if not flattened (backward compatibility)
                template_url = about_data.get('personal', {}).get('cv', {}).get('copy')
        
        if not template_url:
            # Fallback to homepage if CV template URL is not configured
            return HttpResponsePermanentRedirect('/')
            
        resp = HttpResponse(status=302)
        resp['Location'] = iri_to_uri(template_url)
        return resp


def dynamic_css_view(request, css_name):
    """
    Serve CSS files with template variables processed.
    Allows using Django template variables like {{ BASE_URL }} in CSS files.
    """
    valid_css_files = ['onest', 'plus_jakarta_sans']
    
    if css_name not in valid_css_files:
        return HttpResponse('CSS file not found', status=404)
    
    template_name = f'css/{css_name}.css'
    
    response = render(request, template_name, content_type='text/css')
    
    # Set caching headers for better performance
    response['Cache-Control'] = 'public, max-age=86400'  # Cache for 24 hours
    
    return response


def dynamic_webmanifest_view(request):
    """
    Serve site.webmanifest with template variables processed.
    Allows using Django template variables like {{ BASE_URL }} in webmanifest.
    """
    response = render(request, 'site.webmanifest', content_type='application/manifest+json')
    
    # Set caching headers for better performance
    response['Cache-Control'] = 'public, max-age=86400'  # Cache for 24 hours
    
    return response