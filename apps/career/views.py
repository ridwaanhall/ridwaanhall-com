from django.views.generic import TemplateView
from django.shortcuts import render
import logging

from apps.data.experiences_data import ExperiencesData
from apps.data.certifications_data import CertificationsData
from apps.data.education_data import EducationData
from apps.data.about_data import AboutData

logger = logging.getLogger(__name__)

class CareerView(TemplateView):
    template_name = 'career/career.html'
    error_template_name = 'error.html'
    
    def get_context_data(self, **kwargs):
        """Prepare context data for the template"""
        context = super().get_context_data(**kwargs)
        about = AboutData.get_about_data()[0]
        
        context.update({
            'view_certs': 'true',
            'experiences': ExperiencesData.experiences,
            'education': EducationData.education,
            'certifications': CertificationsData.certifications,
            'about': about,
            'seo': self._get_seo_data(about),
        })
        return context
    
    def _get_seo_data(self, about):
        """Generate SEO metadata"""
        return {
            'title': f"Career & Resume | {about['name']} - Professional Experience",
            'description': f"Explore {about['name']}'s professional journey, education, work experience, and certifications. View full resume and career highlights.",
            'keywords': f"{about['name']}, resume, CV, career, professional experience, certifications, education, work history",
            'og_image': about.get('image_url', ''),
            'og_type': 'profile',
            'twitter_card': 'summary',
        }
    
    def get(self, request, *args, **kwargs):
        try:
            context = self.get_context_data(**kwargs)
            return render(request, self.template_name, context)
        except Exception as e:
            logger.error(f"Error in CareerView: {str(e)}", exc_info=True)
            
            error_context = {
                'error_code': 500,
                'error_message': 'An unexpected error occurred. Please try again later.'
            }
            return render(request, self.error_template_name, error_context, status=500)
