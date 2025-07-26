"""
Project #20: PDDIKTI Data API | College Insights
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: PDDIKTI Data API | College Insights
project_data = {
    "id": 20,
    "title": """PDDIKTI Data API | College Insights""",
    "headline": """Tap into Indonesian college data with this dope Django-powered API.""",
    "description": ['This Django REST Framework API serves up student, lecturer, college, and program info with ease.', 'Built for devs who need reliable, quick access to higher ed data for their apps.', 'Keeps things simple and efficient for all your academic data needs.'],
    "images": {
        "pddikti_api_django.webp": f"{settings.PROJECT_BASE_IMG_URL}/pddikti_api_django.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Academic Data Drop', 'description': 'Grab student, lecturer, college, and program info.'}, {'title': 'DRF Power', 'description': 'Django REST Framework fuels scalable API vibes.'}, {'title': 'Clean Endpoints', 'description': 'Structured routes for smooth data integration.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"],
        SkillsData.tech_stack["django_rest_framework"]
    ],
    "github_url": "",
    "demo_url": "",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2023-11-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "API, Education, Data, Django",
    "tags": [
        "API",
        "PDDIKTI",
        "College Data",
        "Django",
        "Django REST Framework",
        "Python",
        "Education",
        "Academic Data",
        "Student Data",
        "Lecturer Data"
    ],
    "priority": 1,
    "slug": ""
}
