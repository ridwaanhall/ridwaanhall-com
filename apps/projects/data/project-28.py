"""
Project #28: Follow Dragon SpaceX Tracker
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: Follow Dragon SpaceX Tracker
project_data = {
    "id": 28,
    "title": """Follow Dragon SpaceX Tracker""",
    "headline": """Chase SpaceX Dragon missions live with Django-powered API swagger.""",
    "description": ['This Django project hooks into external APIs to serve real-time SpaceX Dragon data, rendered in slick HTML templates.', 'The `dragon_public` view grabs JSON data with custom headers, delivering responsive, dynamic visuals.', 'Extra views handle redirects and data rendering for a seamless user experience.'],
    "images": {
        "follow_dragon_spacex.webp": f"{settings.PROJECT_BASE_IMG_URL}/follow_dragon_spacex.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Live API Connect', 'description': 'Pulls JSON data with custom headers for real-time mission tracking.'}, {'title': 'Sleek Template Vibes', 'description': 'Responsive designs make data pop dynamically.'}, {'title': 'Django Dynamism', 'description': 'Robust and scalable thanks to Django’s framework.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["django"]
    ],
    "github_url": "https://github.com/ridwaanhall/follow-dragon-spacex",
    "demo_url": "https://follow-dragon.ridwaanhall.com/",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2024-09-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "API, Space, Real-time Data, Django",
    "tags": [
        "SpaceX",
        "Dragon",
        "API",
        "Django",
        "Python",
        "Real-time Data",
        "External API",
        "Mission Tracking",
        "HTML Templates"
    ],
    "priority": 1,
    "slug": ""
}
