"""
Project #24: Pemilu 2024 Vote Dashboard
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.data.content.types import Feature, ProjectData
from apps.data.about.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=24,
    title='Pemilu 2024 Vote Dashboard',
    headline='Sleek web app for real-time 2024 Indonesia Election vote tracking with Django flair.',
    description=['This fire web app for the 2024 Indonesia Presidential Election lets you explore vote data across regions—from national to polling stations.', 'Built with Django and Django REST Framework for a rock-solid backend, styled with Bootstrap for a clean, responsive look.', 'Packed with verified evidence data, it’s perfect for tracking results or building dope election tools.'],
    features=[
        Feature(title='Region-Specific Insights', description='Dive into vote data from national to TPS levels.'),
        Feature(title='Trusted Evidence', description='Verified data ensures transparency and reliability.'),
        Feature(title='Slick Responsive Design', description='Bootstrap makes it look fire on any screen.'),
    ],
    images={
        "pemilu_2024_website.webp": f"{settings.PROJECT_BASE_IMG_URL}/pemilu_2024_website.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["django_rest_framework"],
        SkillsData.tech_stack["bootstrap"],
    ],
    github_url='https://github.com/ridwaanhall/realcount-pemilu-2024',
    demo_url='',
    category='Web App, Dashboard, Election, Indonesia',
    tags=['Dashboard', 'Pemilu 2024', 'Election Data', 'Django', 'Django REST Framework', 'Bootstrap', 'Python', 'Indonesia', 'Vote Tracking', 'Data Visualization'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2024-04-30T23:59:59+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2024-04-30T23:59:59+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
