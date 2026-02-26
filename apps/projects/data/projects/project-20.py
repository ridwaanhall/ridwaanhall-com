"""
Project #20: PDDIKTI Data API | College Insights
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.projects.types import Feature, ProjectData
from apps.about.data.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=20,
    title='PDDIKTI Data API | College Insights',
    headline='Tap into Indonesian college data with this dope Django-powered API.',
    description=['This Django REST Framework API serves up student, lecturer, college, and program info with ease.', 'Built for devs who need reliable, quick access to higher ed data for their apps.', 'Keeps things simple and efficient for all your academic data needs.'],
    features=[
        Feature(title='Academic Data Drop', description='Grab student, lecturer, college, and program info.'),
        Feature(title='DRF Power', description='Django REST Framework fuels scalable API vibes.'),
        Feature(title='Clean Endpoints', description='Structured routes for smooth data integration.'),
    ],
    images={
        "pddikti_api_django.webp": f"{settings.PROJECT_BASE_IMG_URL}/pddikti_api_django.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["django_rest_framework"],
    ],
    github_url='',
    demo_url='',
    category='API, Education, Data, Django',
    tags=['API', 'PDDIKTI', 'College Data', 'Django', 'Django REST Framework', 'Python', 'Education', 'Academic Data', 'Student Data', 'Lecturer Data'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2023-11-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2023-11-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
