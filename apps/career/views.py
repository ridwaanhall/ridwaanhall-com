from django.views.generic import TemplateView
from django.shortcuts import render
from apps.data import certifications_data

class CareerView(TemplateView):
    def get(self, request):
        try:
            certifications = [certification for certification in certifications_data.CertificationsData.certifications if certification.get('is_featured')]
            context = {
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