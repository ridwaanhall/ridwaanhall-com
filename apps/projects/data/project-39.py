"""
Project #39: OpenShop Product API
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: OpenShop Product API
project_data = {
    "id": 39,
    "title": """OpenShop Product API""",
    "headline": """Slick RESTful API for juggling product data with Django REST Framework.""",
    "description": ['This RESTful API, built with Django REST Framework, handles product data like a champ.', 'Supports full CRUD, product searches, and HATEOAS for smooth navigation.', 'Comes with soft delete, data validation, and proper status codes for a polished experience.'],
    "images": {
        "openshop_restful_api.webp": f"{settings.PROJECT_BASE_IMG_URL}/openshop_restful_api.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Full CRUD', 'description': 'Create, read, update, and delete products with ease.'}, {'title': 'Search by Name', 'description': 'Find products by name with a clean query.'}, {'title': 'HATEOAS Links', 'description': 'Navigate resources with embedded API links.'}, {'title': 'Soft Delete', 'description': 'Mark products as deleted without losing data.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["django_rest_framework"],
        SkillsData.tech_stack["nginx"]
    ],
    "github_url": "https://github.com/ridwaanhall/a743-backend-pemula-python/tree/submission",
    "demo_url": "",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2025-06-14T00:49:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "API, E-commerce, Product Management, Django",
    "tags": [
        "API",
        "E-commerce",
        "Product Management",
        "Django",
        "Django REST Framework",
        "Python",
        "CRUD",
        "HATEOAS",
        "Soft Delete",
        "Backend",
        "Dicoding"
    ],
    "priority": 1,
    "slug": ""
}
