"""
Project #18: Drink Database API
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: Drink Database API
project_data = {
    # Identity
    "id": 18,
    "title": "Drink Database API",
    "headline": "Manage your drink data like a boss with this Django-powered API.",

    # Core Content
    "description": [
        "This Django and DRF-built API makes handling a drink database a total breeze.",
        "Full CRUD vibes: add, update, fetch, or delete drinks with ease.",
        "Perfect for devs looking to plug drink data into their apps with RESTful swagger."
    ],
    "features": [
        {
            "title": "CRUD Crush",
            "description": "Create, read, update, or delete drinks like a pro."
        },
        {
            "title": "DRF Domination",
            "description": "Django REST Framework brings scalable API heat."
        },
        {
            "title": "RESTful Rules",
            "description": "Clean, efficient endpoints built on REST principles."
        }
    ],
    "images": {
        "restful_drink_service.webp": f"{settings.PROJECT_BASE_IMG_URL}/restful_drink_service.webp"
    },

    # Tech & Resources
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["django_rest_framework"]
    ],
    "github_url": "",
    "demo_url": "",

    # Classification
    "category": "API, Database, Drinks, Django",
    "tags": [
        "API",
        "Django",
        "Django REST Framework",
        "Drink Database",
        "CRUD",
        "Python",
        "RESTful",
        "Backend"
    ],

    # Status & Meta
    "is_featured": False,
    "featured_priority": None,
    "status": "completed",
    "created_at": datetime.strptime("2023-11-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2023-11-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
}
