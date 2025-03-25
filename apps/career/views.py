from django.views.generic import TemplateView
from django.shortcuts import render

from apps.data.experiences_data import ExperiencesData
from apps.data.certifications_data import CertificationsData
from apps.data.education_data import EducationData
from apps.data.about_data import AboutData

class CareerView(TemplateView):
    def get(self, request):
        try:
            about = AboutData.get_about_data()
            experiences = [experience for experience in ExperiencesData.experiences]
            education = [education for education in EducationData.education]
            certifications = [certification for certification in CertificationsData.certifications]
            
            # Career page specific SEO
            seo = {
                'title': f"Career & Resume | {about[0]['name']} - Professional Experience",
                'description': f"Explore {about[0]['name']}'s professional journey, education, work experience, and certifications. View full resume and career highlights.",
                'keywords': f"{about[0]['name']}, resume, CV, career, professional experience, certifications, education, work history",
                'og_image': about[0].get('image_url', ''),
                'og_type': 'profile',
                'twitter_card': 'summary',
            }
            
            context = {
                'view_certs': 'true',
                'experiences': experiences,
                'education': education,
                'certifications': certifications,
                'about': about[0],
                'seo': seo,
            }
            return render(request, 'career/career.html', context)

        except AttributeError:
            context = {
                'error_code': 500,
                'error_message': 'Internal server error occurred. Please try again later.'
            }
            return render(request, 'error.html', context, status=500)
        except (TypeError, KeyError):
            context = {
                'error_code': 500,
                'error_message': 'Data processing error occurred. Please try again later.'
            }
            return render(request, 'error.html', context, status=500)
        except (FileNotFoundError, ImportError):
            context = {
                'error_code': 500,
                'error_message': 'Resource loading error occurred. Please try again later.'
            }
            return render(request, 'error.html', context, status=500)
        except Exception:
            context = {
                'error_code': 500,
                'error_message': 'An unexpected error occurred. Please try again later.'
            }
            return render(request, 'error.html', context, status=500)