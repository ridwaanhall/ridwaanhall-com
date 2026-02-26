"""
Project #32: ridwaanhall.pythonanywhere.com
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.data.content.types import Feature, ProjectData
from apps.data.about.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=32,
    title='ridwaanhall.pythonanywhere.com',
    headline='Slick portfolio site with Vuexy HTML and Django, showing off GitHub stats.',
    description=['This portfolio site, powered by Vuexy HTML and Django, is loaded with sections and a GitHub-driven stats dashboard.', 'Rocking a sharp design and a smart backend for easy content updates, plus secure admin access.', 'The dashboard pulls yearly GitHub data to flex my coding grind in style.'],
    features=[
        Feature(title='Loaded Pages', description='Packed with sections like About, Projects, and beyond.'),
        Feature(title='Clean UI', description='Vuexy HTML delivers a pro-grade look.'),
        Feature(title='Git.callbacks', description='Yearly coding insights pulled via API.'),
        Feature(title='Mobile-Friendly', description='Looks dope on any device.'),
    ],
    images={
        "ridwaanhall_pythonanywhere_com.webp": f"{settings.PROJECT_BASE_IMG_URL}/ridwaanhall_pythonanywhere_com.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["github_api"],
    ],
    github_url='',
    demo_url='',
    category='Portfolio, Web App, Dashboard, Django',
    tags=['Portfolio', 'Django', 'Vuexy HTML', 'GitHub API', 'Dashboard', 'Personal Website', 'Python', 'Stats Visualization', 'Mobile Friendly'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
