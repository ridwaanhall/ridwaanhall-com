from django.views.generic import TemplateView
from django.shortcuts import render

from apps.data.experiences_data import ExperiencesData
from apps.data.certifications_data import CertificationsData
from apps.data.education_data import EducationData

class CareerView(TemplateView):
    def get(self, request):
        try:
            experiences = [experience for experience in ExperiencesData.experiences]
            education = [education for education in EducationData.education]
            certifications = [certification for certification in CertificationsData.certifications]
            
            context = {
                'experiences': experiences,
                'education': education,
                'certifications': certifications,
            }
            return render(request, 'career/career.html', context)

        except AttributeError as e:
            context = {
                'error_code': 500,
                'error_message': f'AttributeError: {e}'
            }
            return render(request, 'error.html', context, status=500)
        except (TypeError, KeyError) as e:
            context = {
                'error_code': 500,
                'error_message': f'Data Error: {e}'
            }
            return render(request, 'error.html', context, status=500)
        except (FileNotFoundError, ImportError) as e:
            context = {
                'error_code': 500,
                'error_message': f'Module Error: {e}'
            }
            return render(request, 'error.html', context, status=500)
        except Exception as e:
            context = {
                'error_code': 500,
                'error_message': f'Unexpected Error: {e}'
            }
            return render(request, 'error.html', context, status=500)