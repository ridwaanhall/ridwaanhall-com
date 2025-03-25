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
            
            context = {
                'view_certs': 'true',
                'experiences': experiences,
                'education': education,
                'certifications': certifications,
                'about': about[0],
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