from django.views.generic import TemplateView, View
from django.shortcuts import render
from django.core.exceptions import SuspiciousOperation
from django.utils.text import slugify

from apps.data.projects_data import ProjectsData
from apps.data.about_data import AboutData

def create_seo_dict(title, description, keywords, image_url, og_type='website'):
    """Helper function to create SEO dictionary"""
    return {
        'title': title,
        'description': description,
        'keywords': keywords,
        'og_image': image_url,
        'og_type': og_type,
        'twitter_card': 'summary_large_image',
    }

class ProjectsView(TemplateView):
    template_name = 'projects/projects.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Get all projects and sort them with featured projects first
        projects = sorted(ProjectsData.projects, key=lambda x: not x.get('is_featured', False))
        about = AboutData.get_about_data()[0]
        
        # Extract unique tech stack items
        tech_stack_keywords = list(set([
            tech for project in projects 
            for tech in project.get('tech_stack', [])
        ]))[:10]
        
        seo = create_seo_dict(
            title=f"Projects & Portfolio | {about['name']} - Developer Showcase",
            description=f"Explore {about['name']}'s development projects, applications, and coding portfolio. View demos and source code.",
            keywords=f"{about['name']}, projects, portfolio, developer, applications, demos, github, code samples, {', '.join(tech_stack_keywords)}",
            image_url=projects[0].get('image_url') if projects else about.get('image_url', '')
        )
        
        return {'projects': projects, 'about': about, 'seo': seo}

class ProjectsDetailView(View):
    def get(self, request, title):
        try:
            projects = ProjectsData.projects
            about = AboutData.get_about_data()[0]
            
            project = next((item for item in projects if slugify(item['title']) == title), None)
            
            if not project:
                return render(request, 'error.html', {'error_code': 404}, status=404)
                
            seo = create_seo_dict(
                title=f"{project['title']} | {about['name']} - Project Details",
                description=project['description'],
                keywords=f"{project['title']}, {about['name']}, {', '.join(project.get('tech_stack', []))}",
                image_url=project.get('image_url', about.get('image_url', '')),
                og_type='article'
            )
            
            return render(request, 'projects/projects_detail.html', {
                'project': project,
                'about': about,
                'seo': seo,
            })
            
        except SuspiciousOperation:
            return render(request, 'error.html', {'error_code': 400}, status=400)
        except Exception:
            return render(request, 'error.html', {'error_code': 500}, status=500)
