"""
Project #31: NGL Link Spam
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: NGL Link Spam
project_data = {
    "id": 31,
    "title": """NGL Link Spam""",
    "headline": """Python script to fire off NGL messages, no login required.""",
    "description": ['This Python tool lets you send custom or random messages to NGL without needing an account.', 'Flexes web requests and API skills, automating what’s usually a manual grind.', 'Keeps it cool with built-in rate limits to dodge spamming headaches.'],
    "images": {
        "ngl_link_spamming.webp": f"{settings.PROJECT_BASE_IMG_URL}/ngl_link_spamming.webp"
    },
    "is_featured": False,
    "features": [{'title': 'Custom Messages', 'description': 'Drop your own texts with zero hassle.'}, {'title': 'Random Texts', 'description': 'Generate quirky messages for kicks.'}, {'title': 'No Login', 'description': 'Jump straight to messaging, no sign-up needed.'}],
    "tech_stack": [
        SkillsData.tech_stack["python"]
    ],
    "github_url": "https://github.com/ridwaanhall/ngl-link-spamming",
    "demo_url": "",
    "status": "completed",
    "created_at": None,
    "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "category": "Automation, Messaging, Social Media, Python Script",
    "tags": [
        "NGL",
        "Messaging",
        "Automation",
        "Python",
        "API",
        "Web Requests",
        "Rate Limiting",
        "Social Media"
    ],
    "priority": 1,
    "slug": ""
}
