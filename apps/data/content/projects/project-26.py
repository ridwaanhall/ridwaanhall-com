"""
Project #26: Khodam Color Finder
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: Khodam Color Finder
project_data = {
    "id": 26,
    "title": """Khodam Color Finder""",
    "headline": """Unleash your inner Khodam vibe with this Django-powered online checker.""",
    "description": ['This slick platform lets you discover your Khodam color in a snap, no hassle.', 'Built with Django, it’s open to all for three months starting June 25, 2024.', 'Brings a modern, fun twist to mystical exploration with a smooth user experience.'],
    "images": {
        "default_project_image.webp": f"{settings.PROJECT_BASE_IMG_URL}/default_project_image.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Instant Khodam Check', 'description': 'Find your Khodam color with zero fuss.'}, {'title': 'Open to All', 'description': 'Publicly accessible during its live run.'}, {'title': 'Django Swagger', 'description': 'Rock-solid backend for seamless performance.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"]
    ],
    "github_url": "https://github.com/ridwaanhall/website-cek-khodam",
    "demo_url": "",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2024-06-25T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "Web App, Entertainment, Personality, Django",
    "tags": [
        "Khodam",
        "Color Finder",
        "Django",
        "Python",
        "Personality Test",
        "Entertainment",
        "Online Checker",
        "Mystical"
    ],
    "priority": 1,
    "slug": ""
}
