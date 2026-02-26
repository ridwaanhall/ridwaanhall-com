"""
Project #23: Pemilu 2024 Data Hub
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.projects.types import Feature, ProjectData
from apps.about.data.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=23,
    title='Pemilu 2024 Data Hub',
    headline='Live 2024 Indonesia Election data at your fingertips with Django REST APIs.',
    description=['This API collection is your VIP pass to Indonesia’s 2024 Election data—candidate names, voting stats, all in real-time glory.', 'Powered by Django REST Framework, it’s built tough with clean endpoints and pro-level error handling.', 'Perfect for devs cooking up election trackers or diving deep into vote analysis with flexible, detailed data.'],
    features=[
        Feature(title='Versatile Endpoints', description='Scoop up candidate names, dispute stats, or voting details effortlessly.'),
        Feature(title='Bulletproof Handling', description='Error-proof design keeps your app running like a dream.'),
        Feature(title='Deep Data Dives', description='Grab election insights at any level for epic analysis.'),
    ],
    images={
        "pemilu_2024_api_django.webp": f"{settings.PROJECT_BASE_IMG_URL}/pemilu_2024_api_django.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django_rest_framework"],
    ],
    github_url='https://github.com/ridwaanhall/realcount-pemilu-2024',
    demo_url='',
    category='API, Election, Data, Indonesia',
    tags=['API', 'Pemilu 2024', 'Election Data', 'Django REST Framework', 'Python', 'Indonesia', 'Voting Stats', 'Candidate Data', 'Real-time Data'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2024-03-01T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2024-03-01T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
