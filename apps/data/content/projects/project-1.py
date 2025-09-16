"""
Project #1: MLBB Username Finder
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: MLBB Username Finder
project_data = {
    # Identity
    "id": 1,
    "title": "MLBB Username Finder",
    "headline": "Retrieve Mobile Legends usernames instantly with a lightweight Python API tool.",

    # Core Content
    "description": [
        "This Python-based utility fetches Mobile Legends usernames quickly and reliably.",
        "Simply provide a user ID and zone ID, and the API returns the corresponding player username.",
        "Lightweight, fast, and designed as a handy tool for MLBB fans and developers alike."
    ],
    "features": [
        {
            "title": "Instant Lookups",
            "description": "Fetch usernames in seconds using just a user ID and zone ID."
        },
        {
            "title": "Python Efficiency",
            "description": "Built with Python for speed, simplicity, and smooth performance."
        },
        {
            "title": "API Integration",
            "description": "Leverages API calls to ensure accurate and reliable username retrieval."
        }
    ],
    "images": {
        "mlbb_username_checker.webp": f"{settings.PROJECT_BASE_IMG_URL}/mlbb_username_checker.webp"
    },

    # Tech & Resources
    "tech_stack": [
        SkillsData.tech_stack["python"]
    ],
    "github_url": "",
    "demo_url": "",

    # Classification
    "category": "API, Gaming, Utility",
    "tags": [
        "API",
        "Mobile Legends",
        "MLBB",
        "Username Finder",
        "Python",
        "Game Utility",
        "User Lookup",
        "Gaming Tool"
    ],

    # Status & Meta
    "is_featured": False,
    "featured_priority": None,
    "status": "completed",
    "created_at": datetime.strptime("2023-03-30T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2023-03-30T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
}
