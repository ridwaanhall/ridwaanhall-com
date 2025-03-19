from django.shortcuts import render
from .utils import get_skills
from apps.projects.utils import get_projects
from apps.blog.utils import get_blog_posts

def dashboard_index(request):
    skills = get_skills()
    projects = get_projects()
    posts = get_blog_posts()
    
    # Group skills by category
    skill_categories = {}
    for skill in skills:
        category = skill['category']
        if category not in skill_categories:
            skill_categories[category] = []
        skill_categories[category].append(skill)
    
    # Project stats
    tech_stack_counts = {}
    for project in projects:
        for tech in project['tech_stack']:
            tech_stack_counts[tech] = tech_stack_counts.get(tech, 0) + 1
    
    # Blog stats
    tag_counts = {}
    for post in posts:
        for tag in post['tags']:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
    
    context = {
        'skill_categories': skill_categories,
        'tech_stack_counts': tech_stack_counts,
        'tag_counts': tag_counts,
        'project_count': len(projects),
        'blog_count': len(posts)
    }
    return render(request, 'dashboard/dashboard_index.html', context)