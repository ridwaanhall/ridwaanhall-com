"""
Project #15: Planetary API | Cosmic Data Hub
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: Planetary API | Cosmic Data Hub
project_data = {
    "id": 15,
    "title": """Planetary API | Cosmic Data Hub""",
    "headline": """Explore the solar system with Flask and SQLAlchemy—space data, unlocked.""",
    "description": ['This RESTful Planetary API dishes out juicy details on planets in our solar system.', 'Get names, types, home stars, masses, radii, and Earth distances with ease.', 'Rocking JWT for secure access, CRUD ops, and Flask-Mail for email notifications.'],
    "images": {
        "planetary_api_explore_universe.webp": f"{settings.PROJECT_BASE_IMG_URL}/planetary_api_explore_universe.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Planet Data Galore', 'description': 'Scoop up details on planets, types, and distances.'}, {'title': 'Locked & Loaded', 'description': 'JWT secures user access, registration, and recovery.'}, {'title': 'Dev-Friendly', 'description': 'CRUD ops keep data management clean and tight.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"],
        SkillsData.tech_stack["sqlalchemy"],
        SkillsData.tech_stack["jwt"],
        SkillsData.tech_stack["flask_mail"]
    ],
    "github_url": "",
    "demo_url": "",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2023-10-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "API, Space, Data, Education",
    "tags": [
        "API",
        "Space",
        "Planets",
        "Solar System",
        "Flask",
        "SQLAlchemy",
        "JWT",
        "Flask-Mail",
        "Python",
        "Education",
        "CRUD"
    ],
    "priority": 1,
    "slug": ""
}
