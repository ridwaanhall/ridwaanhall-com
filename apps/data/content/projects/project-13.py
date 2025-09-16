"""
Project #13: Telegram Student Finder Bot
Generated from centralized projects data
"""

from datetime import datetime
from django.conf import settings
from apps.data.about.skills_data import SkillsData

# Project data for: Telegram Student Finder Bot
project_data = {
    # Identity
    "id": 13,
    "title": "Telegram Student Finder Bot",
    "headline": "Hunt down student deets via Telegram with Flask-powered ease.",

    # Core Content
    "description": [
        "This Python Telegram bot, hooked up with Flask and webhooks, makes finding student info a breeze.",
        "Drop a name or student ID, and it’ll list matches—tap one for full details like college and programs.",
        "Your go-to for quick, no-fuss student data lookups."
    ],
    "features": [
        {
            "title": "Slick Search",
            "description": "Find students by name, ID, or both in seconds."
        },
        {
            "title": "Full Profiles",
            "description": "Get name, ID, college, and program details instantly."
        },
        {
            "title": "Flask Finesse",
            "description": "Runs smooth with Flask and Telegram webhooks."
        }
    ],
    "images": {
        "student_search_bot_telegram.webp": f"{settings.PROJECT_BASE_IMG_URL}/student_search_bot_telegram.webp"
    },

    # Tech & Resources
    "tech_stack": [
        SkillsData.tech_stack["python"],
        SkillsData.tech_stack["flask"],
        SkillsData.tech_stack["telegram_api"]
    ],
    "github_url": "",
    "demo_url": "",

    # Classification
    "category": "Bot, Education, Telegram, Student Data",
    "tags": [
        "Telegram Bot",
        "Student Data",
        "Flask",
        "Python",
        "Webhooks",
        "Education",
        "Search Tool",
        "Academic Data"
    ],

    # Status & Meta
    "is_featured": False,
    "featured_priority": None,
    "status": "completed",
    "created_at": datetime.strptime("2023-10-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
    "updated_at": datetime.strptime("2023-10-15T00:00:00+07:00", "%Y-%m-%dT%H:%M:%S%z"),
}
