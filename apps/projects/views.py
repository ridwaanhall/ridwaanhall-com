from django.views.generic import TemplateView, View
from django.shortcuts import render
from django.core.exceptions import SuspiciousOperation
from django.utils.text import slugify

from apps.data.projects_data import ProjectsData
from apps.data.about_data import AboutData

class ProjectsView(TemplateView):
    def get(self, request):
        projects = ProjectsData.projects
        about = AboutData.get_about_data()
        
        seo = {
            'title': f"Projects & Portfolio | {about[0]['name']} - Developer Showcase",
            'description': f"Explore {about[0]['name']}'s development projects, applications, and coding portfolio. View demos and source code.",
            'keywords': f"{about[0]['name']}, projects, portfolio, developer, applications, demos, github, code samples, {', '.join(list(set([tech for project in projects for tech in project.get('tech_stack', [])]))[:10])}",
            'og_image': projects[0].get('image_url') if projects else about[0].get('image_url', ''),
            'og_type': 'website',
            'twitter_card': 'summary_large_image',
        }
        
        context = {
            'projects': projects,
            'about': about[0],
            'seo': seo,
        }
        return render(request, 'projects/projects.html', context)
    
class ProjectsDetailView(View):
    def get(self, request, title):
        projects = ProjectsData.projects
        about = AboutData.get_about_data()

        try:
            if not isinstance(title, str):
                raise SuspiciousOperation("Invalid title format")

            project = next((item for item in projects if slugify(item['title']) == title), None)
            # other_projects = [item for item in projects if slugify(item['title']) != title]

            if project:
                seo = {
                    'title': f"{project['title']} | {about[0]['name']} - Project Details",
                    'description': project['description'],
                    'keywords': f"{project['title']}, {about[0]['name']}, {', '.join(project.get('tech_stack', []))}",
                    'og_image': project.get('image_url', about[0].get('image_url', '')),
                    'og_type': 'article',
                    'twitter_card': 'summary_large_image',
                }
                
                context = {
                    'project': project,
                    'about': about[0],
                    # 'other_projects': other_projects
                    'seo': seo,
                }
                return render(request, 'projects/projects_detail.html', context)
            else:
                context = {
                    'error_code': 404
                }
                return render(request, 'error.html', context, status=404)

        except SuspiciousOperation as e:
            context = {
                'error_code': 400
            }
            return render(request, 'error.html', context, status=400)
        except Exception as e:
            context = {
                'error_code': 500
            }
            return render(request, 'error.html', context, status=500)