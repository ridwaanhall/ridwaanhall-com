"""
Project #31: NGL Link Spam
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: NGL Link Spam
project_data = {
    # Identity
    "id": 31,
    "title": "NGL Link Spam",
    "headline": "Python script to fire off NGL messages, no login required.",

    # Core Content
    "description": [
        "This Python tool lets you send custom or random messages to NGL without needing an account.",
        "Flexes web requests and API skills, automating what’s usually a manual grind.",
        "Keeps it cool with built-in rate limits to dodge spamming headaches."
    ],
    "features": [
        {
            "title": "Custom Messages",
            "description": "Drop your own texts with zero hassle."
        },
        {
            "title": "Random Texts",
            "description": "Generate quirky messages for kicks."
        },
        {
            "title": "No Login",
            "description": "Jump straight to messaging, no sign-up needed."
        }
    ],
    "images": {
        "ngl_link_spamming.webp": f"{settings.PROJECT_BASE_IMG_URL}/ngl_link_spamming.webp"
    },

    # Tech & Resources
    "tech_stack": [
        SkillsData.tech_stack["python"]
    ],
    "github_url": "https://github.com/ridwaanhall/ngl-link-spamming",
    "demo_url": "",

    # Classification
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

    # Status & Meta
    "is_featured": False,
    "featured_priority": None,
    "status": "completed",
    "created_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2025-04-16T21:51:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
}
