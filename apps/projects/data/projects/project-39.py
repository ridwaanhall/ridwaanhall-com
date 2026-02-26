"""
Project #39: OpenShop Product API
"""

from dataclasses import asdict
from datetime import datetime

from django.conf import settings

from apps.projects.types import Feature, ProjectData
from apps.about.data.skills_data import SkillsData


project_data = asdict(ProjectData(
    id=39,
    title='OpenShop Product API',
    headline='Slick RESTful API for juggling product data with Django REST Framework.',
    description=['This RESTful API, built with Django REST Framework, handles product data like a champ.', 'Supports full CRUD, product searches, and HATEOAS for smooth navigation.', 'Comes with soft delete, data validation, and proper status codes for a polished experience.'],
    features=[
        Feature(title='Full CRUD', description='Create, read, update, and delete products with ease.'),
        Feature(title='Search by Name', description='Find products by name with a clean query.'),
        Feature(title='HATEOAS Links', description='Navigate resources with embedded API links.'),
        Feature(title='Soft Delete', description='Mark products as deleted without losing data.'),
    ],
    images={
        "openshop_restful_api.webp": f"{settings.PROJECT_BASE_IMG_URL}/openshop_restful_api.webp",
    },
    tech_stack=[
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["django_rest_framework"],
        SkillsData.tech_stack["nginx"],
    ],
    github_url='https://github.com/ridwaanhall/a743-backend-pemula-python/tree/submission',
    demo_url='',
    category='API, E-commerce, Product Management, Django',
    tags=['API', 'E-commerce', 'Product Management', 'Django', 'Django REST Framework', 'Python', 'CRUD', 'HATEOAS', 'Soft Delete', 'Backend', 'Dicoding'],
    is_featured=False,
    featured_priority=None,
    status='completed',
    created_at=datetime.strptime("2025-06-14T00:49:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    updated_at=datetime.strptime("2025-06-14T00:49:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
))
