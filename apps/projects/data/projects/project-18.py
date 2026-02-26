"""
Project #18: Drink Database API
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.projects.types import Feature, ProjectData
from apps.about.data.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=18,
    title='Drink Database API',
    headline='Manage your drink data like a boss with this Django-powered API.',
    description=['This Django and DRF-built API makes handling a drink database a total breeze.', 'Full CRUD vibes: add, update, fetch, or delete drinks with ease.', 'Perfect for devs looking to plug drink data into their apps with RESTful swagger.'],
    features=[
        Feature(title='CRUD Crush', description='Create, read, update, or delete drinks like a pro.'),
        Feature(title='DRF Domination', description='Django REST Framework brings scalable API heat.'),
        Feature(title='RESTful Rules', description='Clean, efficient endpoints built on REST principles.'),
    ],
    images={
        "restful_drink_service.webp": f"{settings.PROJECT_BASE_IMG_URL}/restful_drink_service.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["django_rest_framework"],
    ],
    github_url='',
    demo_url='',
    category='API, Database, Drinks, Django',
    tags=['API', 'Django', 'Django REST Framework', 'Drink Database', 'CRUD', 'Python', 'RESTful', 'Backend'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2023-11-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2023-11-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
